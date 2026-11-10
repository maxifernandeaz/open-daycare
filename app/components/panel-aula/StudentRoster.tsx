"use client";

import { useMemo, useState } from "react";
import Icon from "@/app/components/Icons";
import { normalizeSearchText } from "@/app/panel-aula/formatters";
import type { RosterStudent } from "@/app/panel-aula/queries";
import StudentCard from "./StudentCard";

const HEADER_CLASSES = "flex flex-wrap items-center justify-between gap-2 px-1";
const TITLE_CLASSES = "font-headline-sm text-headline-sm text-on-surface";
const TOTAL_PILL_CLASSES =
  "px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-bold";
const SEARCH_WRAPPER_CLASSES = "relative";
const SEARCH_ICON_CLASSES = "absolute left-3 top-2.5 text-[18px] text-outline";
const SEARCH_INPUT_CLASSES =
  "w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface font-body-sm text-body-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container";
const GRID_CLASSES = "grid grid-cols-1 md:grid-cols-2 gap-4";
const EMPTY_CLASSES =
  "rounded-xl bg-surface-container-lowest p-6 text-center font-body-sm text-body-sm text-on-surface-variant shadow-sm";
const ERROR_CLASSES =
  "rounded-xl border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container";

type StudentRosterProps = {
  students: RosterStudent[];
  totalChildren: number;
  error: string | null;
  canInvite: boolean;
};

export default function StudentRoster({
  students,
  totalChildren,
  error,
  canInvite,
}: StudentRosterProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearchText(query.trim());

  const visibleStudents = useMemo(() => {
    if (!normalizedQuery) {
      return students;
    }

    return students.filter((student) => {
      const matchesName = normalizeSearchText(student.name).includes(
        normalizedQuery,
      );
      const matchesNickname = student.nickname
        ? normalizeSearchText(student.nickname).includes(normalizedQuery)
        : false;

      return matchesName || matchesNickname;
    });
  }, [students, normalizedQuery]);

  const totalLabel =
    totalChildren === 1 ? "1 Matriculado" : `${totalChildren} Matriculados`;
  const emptyMessage =
    students.length === 0
      ? "Todavía no hay niños registrados."
      : "No hay niños que coincidan con la búsqueda.";

  return (
    <section className="space-y-4">
      <div className={HEADER_CLASSES}>
        <div className="flex items-center gap-2">
          <span className={TITLE_CLASSES}>Alumnos en Aula</span>
          <span className={TOTAL_PILL_CLASSES}>{totalLabel}</span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <div className={`${SEARCH_WRAPPER_CLASSES} min-w-0 flex-1 sm:flex-none`}>
            <Icon className={SEARCH_ICON_CLASSES} name="search" size={18} />
            <input
              aria-label="Buscar por nombre o apodo"
              className={SEARCH_INPUT_CLASSES}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o apodo..."
              type="text"
              value={query}
            />
          </div>
        </div>
      </div>

      {error ? (
        <p className={ERROR_CLASSES} role="alert">
          {error}
        </p>
      ) : null}

      {!error && visibleStudents.length > 0 ? (
        <div className={GRID_CLASSES}>
          {visibleStudents.map((student) => (
            <StudentCard
              canInvite={canInvite}
              key={student.id}
              student={student}
            />
          ))}
        </div>
      ) : null}

      {!error && visibleStudents.length === 0 ? (
        <p className={EMPTY_CLASSES}>{emptyMessage}</p>
      ) : null}
    </section>
  );
}
