export const heroChatScreens = [
  {
    id: "scheduling",
    messages: [
      {
        id: 1,
        type: "sent" as const,
        text: "Tenho uma pintura amanhã às 14h na Rua Augusta 480",
        time: "10:30",
      },
      {
        id: 2,
        type: "received" as const,
        text:
          "Compromisso agendado! 📅\n" +
          '"Pintura - Rua Augusta 480"\n' +
          "Amanhã às 14:00.\n" +
          "Vou te lembrar 1h antes!",
        time: "10:30",
      },
      {
        id: 3,
        type: "sent" as const,
        text: "Não, está ótimo!",
        time: "10:31",
      },
      {
        id: 4,
        type: "received" as const,
        text: "Perfeito! Bom trabalho! 💪",
        time: "10:31",
      },
    ],
    badges: [
      {
        position: "top-left" as const,
        icon: "pdf" as const,
        title: "Orçamento enviado",
        subtitle: "PDF gerado automaticamente",
        appearsAfterMessage: 1,
      },
      {
        position: "bottom-right" as const,
        icon: "revenue" as const,
        title: "+R$2.340",
        subtitle: "Receita do mês",
        appearsAfterMessage: 3,
      },
    ],
  },
  {
    id: "voice",
    messages: [
      {
        id: 1,
        type: "sent" as const,
        text: "",
        time: "11:40",
        isVoice: true,
        voiceDuration: "0:08",
      },
      {
        id: 2,
        type: "received" as const,
        text:
          "Entendi! Orçamento para pintura de sala para o " +
          "Sr. Silva. Gerando PDF... ✅",
        time: "11:40",
      },
      {
        id: 3,
        type: "sent" as const,
        text: "Manda pra ele",
        time: "11:41",
      },
      {
        id: 4,
        type: "received" as const,
        text:
          "PDF enviado para Sr. Silva pelo WhatsApp! 📄\n" +
          "Total: R$1.850,00",
        time: "11:41",
      },
    ],
    badges: [
      {
        position: "top-left" as const,
        icon: "pdf" as const,
        title: "Áudio transcrito",
        subtitle: "IA entende sua voz",
        appearsAfterMessage: 1,
      },
      {
        position: "bottom-right" as const,
        icon: "pdf" as const,
        title: "PDF enviado",
        subtitle: "Com sua marca",
        appearsAfterMessage: 3,
      },
    ],
  },
  {
    id: "finance",
    messages: [
      {
        id: 1,
        type: "sent" as const,
        text: "Gastei R$150 em material",
        time: "14:20",
      },
      {
        id: 2,
        type: "received" as const,
        text: "Despesa registrada! 💰\nR$150,00 - Materiais",
        time: "14:20",
      },
      {
        id: 3,
        type: "sent" as const,
        text: "Quanto ganhei essa semana?",
        time: "14:21",
      },
      {
        id: 4,
        type: "received" as const,
        text:
          "📈 Receitas: R$3.500\n" +
          "📉 Despesas: R$580\n" +
          "💰 Lucro: R$2.920\n\n" +
          "Ótima semana! 🎉",
        time: "14:21",
      },
    ],
    badges: [
      {
        position: "top-left" as const,
        icon: "revenue" as const,
        title: "Lucro +23%",
        subtitle: "vs. mês anterior",
        appearsAfterMessage: 1,
      },
      {
        position: "bottom-right" as const,
        icon: "revenue" as const,
        title: "+R$2.920",
        subtitle: "Lucro da semana",
        appearsAfterMessage: 3,
      },
    ],
  },
];
