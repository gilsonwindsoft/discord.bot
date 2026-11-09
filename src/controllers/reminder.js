const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { DateTime } = require("luxon");
const { Op } = require("sequelize");
const Lembrete = require("../models/lembrete");
const logger = require("../utils/logger");
const {
  RECORRENCIAS,
  parseQuando,
  proximaOcorrencia,
  formatar,
} = require("../utils/quando");

const LIMITE_ATIVOS = 50;
const LOTE_ENTREGA = 100;
const ADIAR_MINUTOS = 10;
const ATRASO_TOLERADO_MS = 2 * 60 * 1000;

// Lembrete único já disparado (entregue ou com falha) e ainda não encerrado.
const PASSADO = { recorrencia: null, status: ["entregue", "falhou"] };

async function criar({
  criador_id,
  destinatario_id,
  guild_id,
  channel_id,
  texto,
  quando,
  recorrencia,
}) {
  const dt = parseQuando(quando);
  if (!dt) return { erro: "invalido" };

  const ativos = await Lembrete.count({
    where: { criador_id, status: "ativo" },
  });
  if (ativos >= LIMITE_ATIVOS) return { erro: "limite" };

  const lembrete = await Lembrete.create({
    criador_id,
    destinatario_id,
    guild_id,
    channel_id,
    texto,
    datahora: dt.set({ millisecond: 0 }).toJSDate(),
    recorrencia: recorrencia || null,
  });
  return { lembrete };
}

function listar(usuario_id) {
  return Lembrete.findAll({
    where: {
      status: "ativo",
      [Op.or]: [{ criador_id: usuario_id }, { destinatario_id: usuario_id }],
    },
    order: [["datahora", "ASC"]],
  });
}

function montarListagem(lembretes, usuario_id) {
  const linhas = lembretes.map((l) => {
    let linha = `**#${l.id}** — ${formatar(l.datahora)} — ${l.texto}`;
    if (l.recorrencia) linha += ` (🔁 ${RECORRENCIAS[l.recorrencia]})`;
    if (l.criador_id !== l.destinatario_id) {
      linha +=
        l.criador_id === usuario_id
          ? ` — para <@${l.destinatario_id}>`
          : ` — de <@${l.criador_id}>`;
    }
    return linha;
  });

  // Embed description aceita até 4096 caracteres.
  let descricao = "";
  let exibidos = 0;
  for (const linha of linhas) {
    if (descricao.length + linha.length + 40 > 4096) break;
    descricao += `${linha}\n`;
    exibidos++;
  }
  if (exibidos < linhas.length) {
    descricao += `+${linhas.length - exibidos} não exibido(s)`;
  }

  return new EmbedBuilder()
    .setTitle("Seus lembretes ativos")
    .setDescription(descricao)
    .setColor("#3498DB");
}

async function descartar(id, usuario_id) {
  const [afetados] = await Lembrete.update(
    { status: "descartado" },
    {
      where: {
        id,
        status: "ativo",
        [Op.or]: [{ criador_id: usuario_id }, { destinatario_id: usuario_id }],
      },
    },
  );
  return afetados > 0;
}

async function buscarDoDestinatario(id, usuario_id) {
  const lembrete = await Lembrete.findByPk(id);
  return lembrete && lembrete.destinatario_id === usuario_id ? lembrete : null;
}

function listarPassados(usuario_id) {
  return Lembrete.findAll({
    where: { destinatario_id: usuario_id, ...PASSADO },
    order: [
      ["datahora", "ASC"],
      ["id", "ASC"],
    ],
  });
}

async function destinatariosComPassados() {
  const linhas = await Lembrete.findAll({
    attributes: ["destinatario_id"],
    where: PASSADO,
    group: ["destinatario_id"],
    raw: true,
  });
  return linhas.map((l) => l.destinatario_id);
}

// `ids` aceita um id ou uma lista de ids; só conclui lembretes do destinatário.
async function concluirPassados(ids, usuario_id) {
  const [afetados] = await Lembrete.update(
    { status: "concluido" },
    { where: { id: ids, destinatario_id: usuario_id, ...PASSADO } },
  );
  return afetados > 0;
}

// Adiar cria um lembrete único novo. O original único passa a `adiado` (o novo
// assume a pendência); o recorrente não muda.
async function adiar(lembrete) {
  if (!lembrete.recorrencia) {
    await Lembrete.update(
      { status: "adiado" },
      { where: { id: lembrete.id, ...PASSADO } },
    );
  }
  return Lembrete.create({
    criador_id: lembrete.criador_id,
    destinatario_id: lembrete.destinatario_id,
    guild_id: lembrete.guild_id,
    channel_id: lembrete.channel_id,
    texto: lembrete.texto,
    datahora: DateTime.now()
      .plus({ minutes: ADIAR_MINUTOS })
      .set({ millisecond: 0 })
      .toJSDate(),
    recorrencia: null,
  });
}

function montarMensagem(lembrete, agendadoPara, agora) {
  const embed = new EmbedBuilder()
    .setTitle("⏰ Lembrete")
    .setDescription(lembrete.texto)
    .setColor("#F1C40F")
    .setTimestamp(agora);

  if (lembrete.criador_id !== lembrete.destinatario_id) {
    embed.addFields({ name: "Criado por", value: `<@${lembrete.criador_id}>` });
  }
  if (lembrete.recorrencia) {
    embed.addFields({
      name: "Repete",
      value: RECORRENCIAS[lembrete.recorrencia],
    });
  }
  if (agora - agendadoPara > ATRASO_TOLERADO_MS) {
    embed.setFooter({ text: `Agendado para ${formatar(agendadoPara)}` });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`lembrete-adiar-${lembrete.id}`)
      .setLabel(`Adiar ${ADIAR_MINUTOS} min`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`lembrete-concluir-${lembrete.id}`)
      .setLabel("Concluir")
      .setStyle(ButtonStyle.Success),
  );

  return {
    embeds: [embed],
    components: [row],
    // O texto é livre: só o destinatário pode ser notificado.
    allowedMentions: { users: [lembrete.destinatario_id] },
  };
}

async function enviar(client, lembrete, mensagem) {
  try {
    const user = await client.users.fetch(lembrete.destinatario_id);
    await user.send(mensagem);
    return true;
  } catch (e) {
    logger.warn(`DM do lembrete #${lembrete.id} falhou: ${e.message}`);
  }

  try {
    const channel = await client.channels.fetch(lembrete.channel_id);
    await channel.send({
      ...mensagem,
      content: `<@${lembrete.destinatario_id}>`,
    });
    return true;
  } catch (e) {
    logger.error(`Lembrete #${lembrete.id} não pôde ser entregue:`, e);
    return false;
  }
}

async function entregar(client, lembrete, agora) {
  const agendadoPara = lembrete.datahora;
  const novo = lembrete.recorrencia
    ? {
        datahora: proximaOcorrencia(
          agendadoPara,
          lembrete.recorrencia,
        ).toJSDate(),
      }
    : { status: "entregue" };

  // Claim condicional: só quem efetivamente mudou a linha entrega (no máximo uma vez).
  const [afetados] = await Lembrete.update(novo, {
    where: { id: lembrete.id, status: "ativo", datahora: agendadoPara },
  });
  if (afetados !== 1) return;

  const ok = await enviar(
    client,
    lembrete,
    montarMensagem(lembrete, agendadoPara, agora),
  );
  if (!ok && !lembrete.recorrencia) {
    await Lembrete.update({ status: "falhou" }, { where: { id: lembrete.id } });
  }
}

async function entregarVencidos(client) {
  const agora = new Date();
  const vencidos = await Lembrete.findAll({
    where: { status: "ativo", datahora: { [Op.lte]: agora } },
    order: [["datahora", "ASC"]],
    limit: LOTE_ENTREGA,
  });

  for (const lembrete of vencidos) {
    try {
      await entregar(client, lembrete, agora);
    } catch (e) {
      logger.error(`Erro ao entregar lembrete #${lembrete.id}:`, e);
    }
  }
}

module.exports = {
  LIMITE_ATIVOS,
  criar,
  listar,
  montarListagem,
  descartar,
  buscarDoDestinatario,
  listarPassados,
  destinatariosComPassados,
  concluirPassados,
  adiar,
  entregarVencidos,
};
