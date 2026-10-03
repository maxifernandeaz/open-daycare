import type { Educator, Tone } from "./mock-classroom";

export type ClassroomCard = {
  id: "cunas" | "soles" | "estrellitas";
  icon: string;
  range: string;
  name: string;
  tagline: string;
  description: string;
  vacancy: { text: string; tone: Tone };
  recommended?: boolean;
};

export type SelectOption = { value: string; label: string };
export type Chip = { id: string; label: string };

export type EnrollmentScreen = {
  breadcrumb: { label: string; href: string; icon?: string }[];
  header: { icon: string; title: string; subtitle: string };
  topActions: { discard: string; save: string };
  avatar: {
    src: string;
    alt: string;
    initials: string;
    label: string;
    description: string;
    pickIllustration: string;
    takePhoto: string;
  };
  classrooms: ClassroomCard[];
  teachers: SelectOption[];
  schedules: SelectOption[];
  allergyChips: Chip[];
  addAllergyChip: string;
  defaults: {
    birthDate: string;
    ageLabel: string;
    classroom: string;
    teacher: string;
    schedule: string;
    gender: string;
    medicationConsent: boolean;
    urgentMedicalFlag: boolean;
  };
  identity: {
    number: string;
    title: string;
    subtitle: string;
    badge: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    birthDateLabel: string;
    genderLabel: string;
    genderOptions: { value: string; label: string; icon: string }[];
    documentLabel: string;
    documentPlaceholder: string;
    nicknameLabel: string;
    nicknamePlaceholder: string;
  };
  classroomSection: {
    number: string;
    title: string;
    subtitle: string;
    badge: string;
    teacherLabel: string;
    scheduleLabel: string;
  };
  health: {
    title: string;
    protocolLabel: string;
    description: string;
    chipsLabel: string;
    detailsLabel: string;
    detailsPlaceholder: string;
    urgentLabel: string;
    urgentDescription: string;
  };
  specialCare: {
    number: string;
    title: string;
    subtitle: string;
    pediatricianLabel: string;
    pediatricianPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    careNotesLabel: string;
    careNotesPlaceholder: string;
    medicationLabel: string;
    medicationDescription: string;
    vaccinationBanner: string;
  };
  stickyBar: { privacy: string; cancel: string; submit: string };
};

const avatarPhoto =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC2wK4CtxTDh4Ku9R3KIzsASsIUdDvZqfktpKsk791AXDH8UkCuyRXZGwugD7ib2TmMKwXjg1IdKs2W2vLHQNbUaA6jGyUHXLIdOnW_9H83hYeggQDQa320BevM3DwI6d_r2W5Rn1HGy2tiq-MmOQDew4zVPCM3j6lorPmWo-TXj4yJjdaJxUe-IHIuqOzw1C7iH54czCvCx6Z6gkW4xooBy4MkKxCXQqek_OydYOzwG237_zMtBMGP";

export const enrollmentScreen: EnrollmentScreen = {
  breadcrumb: [
    { label: "Panel de Aula (Hoy)", href: "#", icon: "home" },
    { label: "Alumnos y Familias", href: "#" },
    { label: "Agregar Nuevo Niño", href: "" },
  ],
  header: {
    icon: "child_care",
    title: "Registrar Nuevo Niño",
    subtitle:
      "Ingresa los datos del menor para integrarlo a su sala, planificar sus cuidados diarios y registrar protocolos médicos de prevención.",
  },
  topActions: { discard: "Descartar", save: "Guardar Ficha" },
  avatar: {
    src: avatarPhoto,
    alt: "Retrato de estudio cálido de un toddler alegre con luz natural suave y fondo verde menta desenfocado",
    initials: "NN",
    label: "Foto de perfil o avatar infantil",
    description:
      "Facilita el reconocimiento visual rápido por parte del personal de cocina, suplentes y educadores.",
    pickIllustration: "Elegir ilustración suave",
    takePhoto: "Tomar foto con cámara del centro",
  },
  classrooms: [
    {
      id: "cunas",
      icon: "crib",
      range: "0 - 1 año",
      name: "Sala Cunas",
      tagline: "Lactantes",
      description:
        "Estimulación temprana, biberones a demanda y ritmos de sueño individuales.",
      vacancy: { text: "3 vacantes libres", tone: "primary" },
    },
    {
      id: "soles",
      icon: "sunny",
      range: "1 - 2 años",
      name: "Sala Soles",
      tagline: "Caminadores (1 a 2 años)",
      description:
        "Primeros pasos autónomos, juego heurístico y lenguaje guiado.",
      vacancy: { text: "5 vacantes libres • Ratio óptimo", tone: "primary" },
      recommended: true,
    },
    {
      id: "estrellitas",
      icon: "auto_stories",
      range: "2 - 3 años",
      name: "Sala Estrellitas",
      tagline: "Exploradores",
      description:
        "Control gradual de esfínteres, asambleas de diálogo y psicomotricidad.",
      vacancy: { text: "1 vacante restante", tone: "tertiary" },
    },
  ],
  teachers: [
    { value: "camila", label: "Camila Rivas (Especialista en Caminadores 1-2)" },
    { value: "sofia", label: "Sofía Navarro (Psicopedagoga Infantil)" },
    { value: "elena", label: "Elena Morales (Directora / Apoyo Pedagógico)" },
  ],
  schedules: [
    { value: "completa", label: "Jornada Completa con Almuerzo y Siesta (8:30 - 16:30)" },
    { value: "manana", label: "Solo Mañanas con Comedor (8:30 - 13:30)" },
    { value: "matinal", label: "Mañanas sin Comedor (9:00 - 12:30)" },
    { value: "tarde", label: "Jornada Vespertina / Taller (14:30 - 18:00)" },
  ],
  allergyChips: [
    { id: "none", label: "Sin alergias conocidas" },
    { id: "aplv", label: "APLV (Proteína leche vaca)" },
    { id: "gluten", label: "Gluten / Celíaco" },
    { id: "nuts", label: "Frutos secos" },
    { id: "egg", label: "Huevo" },
    { id: "fish", label: "Pescado" },
  ],
  addAllergyChip: "Otra alergia específica",
  defaults: {
    birthDate: "2025-04-12",
    ageLabel: "18 meses",
    classroom: "soles",
    teacher: "camila",
    schedule: "completa",
    gender: "nino",
    medicationConsent: true,
    urgentMedicalFlag: false,
  },
  identity: {
    number: "01",
    title: "Datos Personales e Identidad",
    subtitle: "Información oficial para credencial escolar y censo de aula",
    badge: "Obligatorio",
    fullNameLabel: "Nombre completo del niño o niña",
    fullNamePlaceholder: "Ej: Mateo Fernández Gómez",
    birthDateLabel: "Fecha de nacimiento",
    genderLabel: "Género / Identificación (opcional)",
    genderOptions: [
      { value: "nino", label: "Niño", icon: "boy" },
      { value: "nina", label: "Niña", icon: "girl" },
      { value: "no_especificado", label: "Otro", icon: "more_horiz" },
    ],
    documentLabel: "N° Documento / Libro de Familia",
    documentPlaceholder: "Ej: 54930218-K",
    nicknameLabel: "Nombre afectivo o cómo prefiere que lo llamen",
    nicknamePlaceholder: "Ej: 'Matu' o 'Teo'",
  },
  classroomSection: {
    number: "02",
    title: "Asignación Pedagógica de Sala / Aula",
    subtitle:
      "Selecciona el grupo según madurez psicomotriz y rango etario sugerido",
    badge: "Ratio 1:8 Activo",
    teacherLabel: "Educadora Tutora de Referencia",
    scheduleLabel: "Modalidad y Horario Habitual",
  },
  health: {
    title: "Salud, Alergias y Dietas",
    protocolLabel: "Protocolo de Prevención",
    description:
      "Selecciona las condiciones conocidas para alertar de inmediato al cocinero en jefe y mostrar una tarjeta flotante en la tableta del aula.",
    chipsLabel: "Alergias o Intolerancias Diagnosticadas",
    detailsLabel: "Detalles de síntomas o plan de acción de emergencia",
    detailsPlaceholder:
      "Ej: Reacción anafiláctica severa con nuez. Requiere Adrenalina autoinyectable ubicada en botiquín de sala.",
    urgentLabel: "Activar Aviso Visual Urgente",
    urgentDescription:
      "Se mostrará un borde con halo carmesí y banner de máxima atención tanto en las tabletas de asistencia como en la pantalla de cocina escolar.",
  },
  specialCare: {
    number: "04",
    title: "Cuidados Especiales y Siesta",
    subtitle: "Pautas de consuelo, pediatra y autorizaciones",
    pediatricianLabel: "Pediatra de cabecera",
    pediatricianPlaceholder: "Dra. Mariana López",
    phoneLabel: "Teléfono de urgencias",
    phonePlaceholder: "+34 600 000 000",
    careNotesLabel: "Consideraciones para la siesta o consuelo afectivo",
    careNotesPlaceholder:
      "Duerme con su mantita de apego azul. Prefiere suaves caricias en la espalda para conciliar el descanso.",
    medicationLabel: "Consentimiento de Medicación",
    medicationDescription:
      "Los tutores autorizan la administración de antitérmicos / medicamentos recetados previa presentación de orden médica firmada.",
    vaccinationBanner:
      "Los tutores legales recibirán un enlace seguro por SMS/Email para adjuntar cartilla de vacunación.",
  },
  stickyBar: {
    privacy:
      "Datos protegidos bajo protocolo RGPD de infancia y encriptación de grado escolar.",
    cancel: "Cancelar / Volver a la lista",
    submit: "Registrar Niño y Crear Ficha",
  },
};

export type { Educator };
