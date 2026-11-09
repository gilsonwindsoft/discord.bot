const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const TarefaLembreteHorario = require("../models/tarefaLembreteHorario");
const TaskController = require("./task");
const ReminderController = require("./reminder");
const logger = require("../utils/logger");
const {
  HORARIOS_PADRAO,
  agoraSP,
  formatar,
  mesclarHorarios,
} = require("../utils/quando");

const MAX_LEMBRETES = 25;
const RODAPE = "Configure os horários com /tarefa lembretes";

const SEM_PENDENCIAS = {
  content: "✅ Nenhuma pendência.",
  embeds: [],
  components: [],
};

// Lembretes passados exibidos no resumo; os mesmos viram opções do modal.
async function lembretesExibidos(usuario_id) {
  const passados = await ReminderController.listarPassados(usuario_id);
  return { passados, exibidos: passados.slice(0, MAX_LEMBRETES) };
}

// Mensagem do resumo (DM e atualização pelos botões); null sem pendências.
async function montarResumo(usuario_id) {
  const [tarefas, { passados, exibidos }] = await Promise.all([
    TaskController.montarPendentes(usuario_id),
    lembretesExibidos(usuario_id),
  ]);
  if (!tarefas.embeds.length && !passados.length) return null;

  const embeds = [...tarefas.embeds];
  const botoes = [];

  if (tarefas.embeds.length) {
    botoes.push(
      new ButtonBuilder()
        .setCustomId("resumo-tarefas-marcar")
        .setLabel("☑️ Marcar concluídas")
        .setStyle(ButtonStyle.Success),
    );
  }

  if (passados.length) {
    let descricao = exibidos
      .map((l) => {
        let linha = `- ${formatar(l.datahora)} — ${TaskController.truncar(
          l.texto,
        )}`;
        if (l.criador_id !== l.destinatario_id)
          linha += ` — de <@${l.criador_id}>`;
        return linha;
      })
      .join("\n");
    if (passados.length > exibidos.length) {
      descricao += `\n+${passados.length - exibidos.length} não exibido(s)`;
    }
    embeds.push(
      new EmbedBuilder()
        .setTitle(`Lembretes não concluídos (${passados.length})`)
        .setDescription(descricao)
        .setColor("#F1C40F"),
    );
    botoes.push(
      new ButtonBuilder()
        .setCustomId("resumo-lembretes-concluir")
        .setLabel("✅ Concluir lembretes")
        .setStyle(ButtonStyle.Primary),
    );
  }

  embeds[embeds.length - 1].setFooter({ text: RODAPE });

  return {
    content: "",
    embeds,
    components: [new ActionRowBuilder().addComponents(botoes)],
    // Texto livre e menções de criador não devem notificar ninguém.
    allowedMentions: { parse: [] },
  };
}

async function montarAtualizacao(usuario_id) {
  return (await montarResumo(usuario_id)) ?? SEM_PENDENCIAS;
}

async function horariosDo(usuario_id) {
  return mesclarHorarios(
    await TarefaLembreteHorario.findAll({ where: { usuario_id } }),
  );
}

// Upsert por (usuario_id, posicao); campo omitido mantém o valor atual.
async function configurarHorario(usuario_id, posicao, { horario, ativo }) {
  const atual = (await horariosDo(usuario_id)).find(
    (h) => h.posicao === posicao,
  );
  await TarefaLembreteHorario.upsert({
    usuario_id,
    posicao,
    horario: horario ?? atual.horario,
    ativo: ativo ?? atual.ativo,
  });
}

async function montarConfiguracao(usuario_id) {
  const linhas = (await horariosDo(usuario_id)).map((h) =>
    h.ativo
      ? `✅ **${h.nome}** — ${h.horario}`
      : `🔕 **${h.nome}** — ${h.horario} (desativado)`,
  );
  return new EmbedBuilder()
    .setTitle("Lembretes de pendências")
    .setDescription(linhas.join("\n"))
    .setFooter({
      text: "Enviados por DM de segunda a sexta, só quando houver pendências.",
    })
    .setColor("#3498DB");
}

async function enviarResumos(client) {
  const agora = agoraSP().toFormat("HH:mm");

  // Saída antecipada: nenhum padrão nem configuração ativa neste minuto.
  if (
    !HORARIOS_PADRAO.some((h) => h.horario === agora) &&
    !(await TarefaLembreteHorario.count({
      where: { horario: agora, ativo: true },
    }))
  ) {
    return;
  }

  const [comTarefas, comLembretes] = await Promise.all([
    TaskController.usuariosComPendentes(),
    ReminderController.destinatariosComPassados(),
  ]);
  const candidatos = [...new Set([...comTarefas, ...comLembretes])];
  if (!candidatos.length) return;

  const configuracoes = await TarefaLembreteHorario.findAll({
    where: { usuario_id: candidatos },
  });

  for (const usuario_id of candidatos) {
    const horarios = mesclarHorarios(
      configuracoes.filter((c) => c.usuario_id === usuario_id),
    );
    // Horários repetidos geram um único envio.
    if (!horarios.some((h) => h.ativo && h.horario === agora)) continue;

    try {
      const mensagem = await montarResumo(usuario_id);
      if (!mensagem) continue;
      const user = await client.users.fetch(usuario_id);
      await user.send(mensagem);
    } catch (e) {
      logger.warn(
        `Resumo de pendências para ${usuario_id} falhou: ${e.message}`,
      );
    }
  }
}

module.exports = {
  lembretesExibidos,
  montarAtualizacao,
  configurarHorario,
  montarConfiguracao,
  enviarResumos,
};
