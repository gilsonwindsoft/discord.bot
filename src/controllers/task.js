const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  ComponentType,
} = require("discord.js");
const { Op } = require("sequelize");
const Tarefa = require("../models/tarefa");
const { sequelize } = require("../database");

const MAX_EXIBIDAS = 25;
const MAX_CONCLUIDAS = 10;
const MAX_POR_GRUPO = 10; // limite do CheckboxGroup do Discord
const MODAL_TIMEOUT_MS = 10 * 60 * 1000;

function adicionar(usuario_id, tarefas) {
  const agora = new Date();
  return sequelize.transaction((transaction) =>
    Tarefa.bulkCreate(
      tarefas.map((t) => ({
        usuario_id,
        texto: t.texto,
        concluida: t.concluida,
        concluida_em: t.concluida ? agora : null,
      })),
      { transaction },
    ),
  );
}

// Bots não têm shortcodes (:black_square_button:) convertidos; usar o emoji Unicode.
const PENDENTE = "🔲";
const CONCLUIDA = "☑️";

// Até 25 linhas de 100 caracteres cabem no limite de 4096 da descrição do embed.
function linhas(tarefas, marca) {
  return tarefas.map((t) => `- ${marca} ${truncar(t.texto)}`).join("\n");
}

function truncar(texto, max = 100) {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

function listarPendentes(usuario_id) {
  return Tarefa.findAll({
    where: { usuario_id, concluida: false },
    order: [["id", "ASC"]],
    limit: MAX_EXIBIDAS,
  });
}

// Resposta de /tarefa listar (também usada para atualizar a lista após o botão).
async function montarPendentes(usuario_id) {
  const pendentes = await Tarefa.findAll({
    where: { usuario_id, concluida: false },
    order: [["id", "ASC"]],
  });

  if (!pendentes.length) {
    return {
      content: "Você não tem tarefas pendentes.",
      embeds: [],
      components: [],
    };
  }

  const exibidas = pendentes.slice(0, MAX_EXIBIDAS);
  let descricao = linhas(exibidas, PENDENTE);
  if (pendentes.length > exibidas.length) {
    descricao += `\n+${pendentes.length - exibidas.length} não exibida(s)`;
  }

  const components = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("tarefa-marcar")
        .setLabel("☑️ Marcar concluídas")
        .setStyle(ButtonStyle.Success),
    ),
  ];

  return {
    content: "",
    embeds: [
      new EmbedBuilder()
        .setTitle(`Tarefas pendentes (${pendentes.length})`)
        .setDescription(descricao)
        .setColor("#3498DB"),
    ],
    components,
  };
}

async function usuariosComPendentes() {
  const linhas = await Tarefa.findAll({
    attributes: ["usuario_id"],
    where: { concluida: false },
    group: ["usuario_id"],
    raw: true,
  });
  return linhas.map((l) => l.usuario_id);
}

// Modal com uma caixa por item pendente (os mesmos exibidos na listagem).
// LabelBuilder não tem setter para CheckboxGroup; usa o objeto da API.
function montarModalMarcar(
  customId,
  pendentes,
  { titulo = "Marcar tarefas concluídas", rotulo = "Tarefas" } = {},
) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(titulo);

  for (let i = 0; i < pendentes.length; i += MAX_POR_GRUPO) {
    const grupo = pendentes.slice(i, i + MAX_POR_GRUPO);
    modal.addLabelComponents({
      type: ComponentType.Label,
      label:
        pendentes.length > MAX_POR_GRUPO
          ? `${rotulo} ${i + 1}–${i + grupo.length}`
          : `${rotulo} pendentes`,
      component: {
        type: ComponentType.CheckboxGroup,
        custom_id: `grupo-${i / MAX_POR_GRUPO}`,
        required: false,
        min_values: 0,
        max_values: grupo.length,
        options: grupo.map((t) => ({
          value: String(t.id),
          label: truncar(t.texto),
        })),
      },
    });
  }
  return modal;
}

// Mostra o modal e espera o envio; retorna { submit, ids } ou null se fechado/expirado.
async function coletarMarcados(interaction, customId, modal) {
  await interaction.showModal(modal);

  let submit;
  try {
    submit = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === customId,
      time: MODAL_TIMEOUT_MS,
    });
  } catch {
    return null;
  }

  // Grupo sem nenhuma caixa marcada pode não vir no envio.
  // Collection.flatMap espera Collections; converter para array antes.
  const ids = [...submit.fields.fields.values()]
    .filter((field) => field.customId.startsWith("grupo-"))
    .flatMap((field) => field.values || [])
    .map(Number);
  return { submit, ids };
}

// Sugestões do autocomplete de /tarefa concluir (só pendentes) e /tarefa remover (todas).
async function sugerir(usuario_id, busca, incluirConcluidas = false) {
  const termo = String(busca || "").trim();
  const where = { usuario_id };
  if (!incluirConcluidas) where.concluida = false;
  if (termo) where.texto = { [Op.like]: `%${termo}%` };
  const tarefas = await Tarefa.findAll({
    where,
    order: [
      ["concluida", "ASC"],
      ["id", "ASC"],
    ],
    limit: 25,
  });
  return tarefas.map((t) => ({
    name: truncar(`${t.concluida ? CONCLUIDA : PENDENTE} ${t.texto}`),
    value: t.id,
  }));
}

// `id` aceita um id ou uma lista de ids.
async function concluir(id, usuario_id) {
  const [afetados] = await Tarefa.update(
    { concluida: true, concluida_em: new Date() },
    { where: { id, usuario_id, concluida: false } },
  );
  return afetados > 0;
}

async function remover(id, usuario_id) {
  return (await Tarefa.destroy({ where: { id, usuario_id } })) > 0;
}

async function montarConcluidas(usuario_id) {
  const concluidas = await Tarefa.findAll({
    where: { usuario_id, concluida: true },
    order: [
      ["concluida_em", "DESC"],
      ["id", "DESC"],
    ],
    limit: MAX_CONCLUIDAS,
  });

  if (!concluidas.length) {
    return { content: "Você não tem tarefas concluídas." };
  }

  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("Tarefas concluídas recentemente")
        .setDescription(linhas(concluidas, CONCLUIDA))
        .setColor("#57F287"),
    ],
  };
}

module.exports = {
  adicionar,
  montarPendentes,
  listarPendentes,
  usuariosComPendentes,
  montarModalMarcar,
  coletarMarcados,
  truncar,
  sugerir,
  concluir,
  remover,
  montarConcluidas,
};
