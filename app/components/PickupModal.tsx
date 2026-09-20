"use client";

import { useState, type FormEvent } from "react";
import Icon from "@/app/components/Icons";

type PickupModalProps = {
  open: boolean;
  childName: string;
  onClose: () => void;
  onConfirm: (personName: string) => void;
};

const RELATION_OPTIONS = [
  "Abuelo / Abuela",
  "Tío / Tía",
  "Amigo/a de la familia",
  "Cuidador/a particular",
  "Otro familiar",
];

export default function PickupModal({
  open,
  childName,
  onClose,
  onConfirm,
}: PickupModalProps) {
  const [personName, setPersonName] = useState("");

  if (!open) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onConfirm(personName.trim());
    setPersonName("");
  };

  return (
    <div
      aria-labelledby="authModalTitle"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
    >
      <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-5 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-container/20 text-on-primary-container flex items-center justify-center">
              <Icon name="badge" size={26} />
            </div>
            <div>
              <h3
                className="font-headline-sm text-headline-sm text-on-surface"
                id="authModalTitle"
              >
                Nueva Autorización de Recogida
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Seguridad y validación instantánea para {childName}
              </p>
            </div>
          </div>
          <button
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label
              className="font-label-md text-label-md text-on-surface"
              htmlFor="authName"
            >
              Nombre y Apellidos de la persona autorizada
            </label>
            <input
              className="px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container"
              id="authName"
              onChange={(event) => setPersonName(event.target.value)}
              placeholder="Ej. Roberto Gómez Morales"
              required
              type="text"
              value={personName}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface"
                htmlFor="authDni"
              >
                DNI / NIE (Obligatorio)
              </label>
              <input
                className="px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container"
                id="authDni"
                placeholder="12345678X"
                required
                type="text"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface"
                htmlFor="authRelation"
              >
                Parentesco o Relación
              </label>
              <select
                className="px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container"
                id="authRelation"
              >
                {RELATION_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md text-on-surface">
              Tipo de Validez
            </span>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container">
                <input
                  className="accent-primary"
                  defaultChecked
                  name="validity"
                  type="radio"
                />
                <span className="font-label-md text-label-md text-on-surface">
                  Sólo Hoy (Puntual)
                </span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container">
                <input className="accent-primary" name="validity" type="radio" />
                <span className="font-label-md text-label-md text-on-surface">
                  Permanente (Curso)
                </span>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm pt-1">
            <Icon name="security" size={18} className="text-primary" />
            <span>
              La persona deberá presentar su DNI original en recepción al llegar.
            </span>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md font-bold transition-all shadow-sm"
              type="submit"
            >
              Confirmar y Emitir QR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}