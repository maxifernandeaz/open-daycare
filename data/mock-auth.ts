import { classroomShell } from "./mock-classroom";

export const BRAND_LOGO_SRC = "/kiddicare-logo.png";

const brand: BrandRef = {
  name: classroomShell.brand.name,
  logoAlt: classroomShell.brand.logoAlt,
  logoSrc: BRAND_LOGO_SRC,
  centerName: classroomShell.center.name,
};

export const loginScreen = {
  brand,
  hero: {
    headline: "El día de cada niño, compartido con su familia.",
    body: "Publicá momentos, gestioná las salas y mantené a las familias cerca, desde un solo lugar.",
  },
  form: {
    title: "Iniciar sesión",
    subtitle: "Ingresá para ver el día de hoy.",
    fields: [
      {
        id: "email",
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "tu@correo.com",
        autoComplete: "email",
      },
      {
        id: "password",
        name: "password",
        label: "Contraseña",
        type: "password",
        placeholder: "••••••••",
        autoComplete: "current-password",
      },
    ] satisfies AuthFieldData[],
    forgotLabel: "¿Olvidaste tu contraseña?",
    submitLabel: "Iniciar sesión",
  },
  footer: {
    prefix: "¿Te invitó la guardería?",
    linkLabel: "Activá tu cuenta",
    linkHref: "/activar-cuenta",
  },
} satisfies LoginScreen;

export const activationScreen = {
  brand,
  header: {
    title: "Bienvenida a KiddiCare",
    body: "Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta.",
  },
  child: {
    initial: "M",
    name: "Mateo",
    classroom: "Aula Estrellitas",
    invitationLabel: "Te invitaron a seguir a",
  },
  fields: [
    {
      id: "invite-code",
      name: "inviteCode",
      label: "Código de invitación",
      type: "text",
      defaultValue: "7 K 4 P 9",
      readOnly: true,
      autoComplete: "off",
      spaced: true,
    },
    {
      id: "email",
      name: "email",
      label: "Email",
      type: "email",
      defaultValue: "lucia.fernandez@gmail.com",
      autoComplete: "email",
    },
    {
      id: "password",
      name: "password",
      label: "Crear contraseña",
      type: "password",
      placeholder: "••••••••••",
      autoComplete: "new-password",
      spaced: true,
    },
  ] satisfies AuthFieldData[],
  consent: {
    label:
      "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.",
  },
  submitLabel: "Activar mi cuenta",
} satisfies ActivationScreen;

export type BrandRef = { name: string; logoAlt: string; logoSrc: string; centerName: string };

export type AuthFieldData = {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder?: string;
  defaultValue?: string;
  readOnly?: boolean;
  autoComplete?: string;
  spaced?: boolean;
};

export type LoginScreen = {
  brand: BrandRef;
  hero: { headline: string; body: string };
  form: {
    title: string;
    subtitle: string;
    fields: AuthFieldData[];
    forgotLabel: string;
    submitLabel: string;
  };
  footer: { prefix: string; linkLabel: string; linkHref: string };
};

export type ActivationScreen = {
  brand: BrandRef;
  header: { title: string; body: string };
  child: { initial: string; name: string; classroom: string; invitationLabel: string };
  fields: AuthFieldData[];
  consent: { label: string };
  submitLabel: string;
};
