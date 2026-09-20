const childPhoto =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCKf3j2e92Gk-k4gP4f2o8_wA6W6-P7M3UuL3e5g6gq9a_n1M8Q-W_F2A=s600";

const childFallbackPhoto =
  "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=400&q=80";

const highlightImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCKf3j2e92Gk-k4gP4f2o8_wA6W6-P7M3UuL3e5g6gq9a_n1M8Q-W_F2A=s1200";

const highlightFallbackImage =
  "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=1200&q=80";

const authorizedPeople: AuthorizedPerson[] = [
  {
    id: "p1",
    name: "Carmen López",
    relation: "Abuela materna",
    dni: "DNI ***4829J",
    badge: "Hoy",
  },
  {
    id: "p2",
    name: "David Gómez",
    relation: "Padre (Tutor legal)",
    dni: "DNI ***9182L",
    badge: "Habitual",
  },
  {
    id: "p3",
    name: "Laura Ramos",
    relation: "Tía",
    dni: "DNI ***6741K",
    badge: "Emergencias",
  },
];

const notices: Notice[] = [
  {
    id: "n1",
    icon: "rainy",
    title: "Mañana: Botas de agua",
    text: "Saldremos a los charcos del patio cubierto. Traer botitas marcadas y recambio seco extra en la bolsita.",
  },
  {
    id: "n2",
    icon: "restaurant_menu",
    title: "Menú de mañana publicado",
    text: "Crema de lentejas rojas y merluza al horno con patatitas.",
  },
];

export const dailyHome = {
  child: {
    name: "Mateo Gómez",
    classroom: "Aula Estrellitas",
    age: "18 meses",
    photo: childPhoto,
    fallbackPhoto: childFallbackPhoto,
    avatarEmoji: "🧸",
    allergies: ["APLV (Proteína Láctea)"],
    liveStatus: {
      text: "En siesta reconfortante",
      since: "desde las 12:45h",
    },
    attendance: {
      state: "Presente",
      arrivedAt: "Llegada 08:35h con David",
      withPerson: "David",
    },
    tutors: [
      { name: "Elena Morales", role: "Tutora" },
      { name: "Carlos Méndez", role: "" },
    ],
  } satisfies ChildInfo,
  metrics: [
    {
      id: "food",
      icon: "restaurant",
      iconTone: "primary",
      badge: "Comió todo (100%)",
      badgeTone: "primary",
      label: "Almuerzo & Nutrición",
      title: "Puré de Calabacín y Pavo",
      description:
        "Plato APLV adaptado al vapor. Comió con excelente apetito y le encantó el plátano dulce de postre.",
      progress: 100,
      footnote: "",
    },
    {
      id: "nap",
      icon: "bedtime",
      iconTone: "secondary",
      badge: "Durmiendo ahora",
      badgeTone: "secondary",
      label: "Siesta & Descanso",
      title: "1h 20m",
      description:
        "Descansando plácidamente en cuna baja con su mantita de estrellas y nana ambiental.",
      progress: 75,
      footnote: "",
    },
    {
      id: "hygiene",
      icon: "baby_changing_station",
      iconTone: "tertiary",
      badge: "2 Cambios hoy",
      badgeTone: "tertiary",
      label: "Higiene & Pañales",
      title: "Último: 12:30h",
      description:
        "10:15h (Mojado) · 12:30h (Limpio antes de acostarse). Piel sin irritaciones, crema hidratante aplicada.",
      footnote: "Crema de pañal aplicada",
    },
    {
      id: "mood",
      icon: "sentiment_very_satisfied",
      iconTone: "primary",
      badge: "Muy alegre",
      badgeTone: "primary",
      label: "Estado de Ánimo",
      title: "Curioso y Sonriente",
      description:
        "Ha participado con entusiasmo en la asamblea de canciones y en el rincón de construcción.",
      footnote: "Interacción activa con Martina y Leo",
    },
  ] satisfies MetricCard[],
  timeline: [
    {
      id: "sleep",
      time: "12:45h",
      title: "Siesta iniciada",
      description:
        "Mateo se ha dormido muy tranquilo escuchando música relajante ambiental tras el cuento de los animalitos del bosque. Tiene su mantita azul de apego.",
      icon: "bedtime",
      iconTone: "secondary",
      meta: [{ label: "Música instrumental suave · Cuna baja protegida", tone: "secondary" }],
    },
    {
      id: "lunch",
      time: "12:15h",
      title: "Almuerzo servido y completado",
      description:
        "Menú especial libre de lácteos servido en vajilla identificada. Ha comido el 100% del plato de verduritas con pavo y ha pedido repetir plátano troceado. Hidratación: 150ml de agua fresca.",
      icon: "restaurant",
      iconTone: "primary",
      meta: [
        { label: "APLV Validado", tone: "error" },
        { label: "Aceptación excelente", tone: "primary" },
        { label: "Supervisado por Carlos M.", tone: "onSurfaceVariant" },
      ],
    },
    {
      id: "hygiene",
      time: "11:30h",
      title: "Cambio de Pañal e Higiene",
      description:
        "Control rutinario antes de pasar a la mesa de comedor. Piel limpia, sana y sin rojeces. Lavado de manitas y carita con agua tibia.",
      icon: "water_drop",
      iconTone: "tertiary",
      meta: [],
    },
    {
      id: "activity",
      time: "10:00h",
      title: "Actividad Pedagógica: Taller Sensorial",
      description:
        "Manipulación de hojas secas de textura, cesto de tesoros de madera y encajables geométricos Montessori. Gran coordinación óculo-manual.",
      icon: "palette",
      iconTone: "surface",
      meta: [],
    },
    {
      id: "checkin",
      time: "08:35h",
      title: "Bienvenida al Aula y Entrada",
      description:
        "Entrada alegre con papá (David Gómez). Ha colgado su mochila en la percha del perrito y ha saludado a la tutora con un abrazo. Temperatura normal (36.4°C).",
      icon: "login",
      iconTone: "primary",
      meta: [],
    },
  ] satisfies TimelineEvent[],
  highlight: {
    author: { name: "Elena Morales", role: "Tutora Titular" },
    timeTitle: "Hoy a las 11:15h · Taller Sensorial de Otoño",
    image: highlightImage,
    fallbackImage: highlightFallbackImage,
    placeLabel: "Espacio Montessori · Bloques de textura y madera",
    description:
      "«Hoy Mateo ha disfrutado muchísimo encajando las piezas de madera y compartiendo los cubos blanditos con Martina. Ha mostrado muchísima curiosidad con los contrastes de colores y no paraba de reír cuando se caía la torrecita. ¡Está dando pasos agigantados en su motricidad fina!»",
    likesLabel: "12 familias y profes",
    albumActionLabel: "Añadir a mi álbum",
  } satisfies TeacherPost,
};

export const homeConfig = {
  classroomName: "Aula Estrellitas",
  dates: {
    feedDate: "Jueves, 24 de Octubre de 2024 · Registro en tiempo real",
    pickupTime: "16:30h",
    protocolUpdatedAt: "15 Oct",
  },
  passCode: "#942-KC",
  authorizedPeople,
  notices,
  medicalProtocol: {
    title: "Protocolo Médico Activo",
    subtitle: "Revisión periódica pediátrica",
    alertTitle: "Alergia Grave a la PLV",
    alertText:
      "Tolerancia 0 a trazas lácteas. Menú verificado con cocinera (María T.). El botiquín de aula dispone de antihistamínico prescrito autorizado por la pediatra.",
    ctaLabel: "Ver ficha médica",
  },
} satisfies HomeConfig;

export type LiveStatus = { text: string; since: string };
export type Attendance = { state: "Presente"; arrivedAt: string; withPerson: string };
export type Tutor = { name: string; role: string };

export type ChildInfo = {
  name: string;
  classroom: string;
  age: string;
  photo: string;
  fallbackPhoto: string;
  avatarEmoji: string;
  allergies: string[];
  liveStatus: LiveStatus;
  attendance: Attendance;
  tutors: Tutor[];
};

export type MetricCard = {
  id: "food" | "nap" | "hygiene" | "mood";
  icon: string;
  iconTone: string;
  badge: string;
  badgeTone: string;
  label: string;
  title: string;
  description: string;
  progress?: number;
  footnote: string;
};

export type TimelineEvent = {
  id: string;
  time: string;
  title: string;
  description: string;
  icon: string;
  iconTone: string;
  meta: { label: string; tone?: string }[];
};

export type TeacherPost = {
  author: { name: string; role: string };
  timeTitle: string;
  image: string;
  fallbackImage: string;
  placeLabel: string;
  description: string;
  likesLabel: string;
  albumActionLabel: string;
};

export type AuthorizedPerson = {
  id: string;
  name: string;
  relation: string;
  dni: string;
  badge: string;
};

export type Notice = { id: string; icon: string; title: string; text: string };

export type HomeConfig = {
  classroomName: string;
  dates: { feedDate: string; pickupTime: string; protocolUpdatedAt: string };
  passCode: string;
  authorizedPeople: AuthorizedPerson[];
  notices: Notice[];
  medicalProtocol: {
    title: string;
    subtitle: string;
    alertTitle: string;
    alertText: string;
    ctaLabel: string;
  };
};