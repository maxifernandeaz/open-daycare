"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import type { TeacherPost } from "@/data/mock";
import Icon from "@/app/components/Icons";

type TeacherHighlightProps = {
  post: TeacherPost;
  onNotify?: (message: string) => void;
};

function teacherInitials(fullName: string) {
  return fullName
    .split(" ")
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join("");
}

export default function TeacherHighlight({
  post,
  onNotify,
}: TeacherHighlightProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [replyVisible, setReplyVisible] = useState(false);
  const [replyText, setReplyText] = useState("");

  const toggleLike = () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    if (nextLiked) {
      onNotify?.("¡Has enviado un 'Me encanta' a la tutora!");
    }
  };

  const focusTeacherMessage = () => setReplyVisible((prev) => !prev);

  const sendTeacherMessage = () => {
    const text = replyText.trim();
    if (!text) return;
    onNotify?.(`Mensaje enviado a Elena Morales: "${text}"`);
    setReplyText("");
    setReplyVisible(false);
  };
  return (
    <article className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="p-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary font-title-md text-title-md">
            {teacherInitials(post.author.name)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-title-md text-title-md text-on-surface">
                {post.author.name}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                {post.author.role}
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {post.timeTitle}
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-fixed/40 text-secondary font-label-sm text-label-sm">
          <Icon name="star" size={15} fill />
          Foto del Día
        </span>
      </div>
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-surface-container overflow-hidden group">
        <img
          alt="Mateo jugando concentrado y sonriendo con cubos sensoriales y maderas de colores en la alfombra del aula"
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          onError={(event) => {
            event.currentTarget.src = post.fallbackImage;
          }}
          src={post.image}
        />
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <span className="px-3 py-1.5 rounded-xl bg-inverse-surface/80 text-inverse-on-surface backdrop-blur-md font-label-sm text-label-sm">
            {post.placeLabel}
          </span>
          <button
            className="pointer-events-auto px-3 py-1.5 rounded-xl bg-surface-container-lowest/90 hover:bg-surface-container-lowest text-on-surface backdrop-blur-md font-label-sm text-label-sm flex items-center gap-1.5 shadow-sm transition-all"
            onClick={() => onNotify?.("Descargando imagen en alta resolución...")}
            type="button"
          >
            <Icon name="download" size={16} />
            Guardar recuerdo
          </button>
        </div>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
          {post.description}
        </p>
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-error-container hover:text-on-error-container text-on-surface-variant font-label-md text-label-md transition-colors"
              onClick={toggleLike}
              type="button"
            >
              <Icon
                name="favorite"
                size={18}
                fill={isLiked}
                className={isLiked ? "text-error" : ""}
              />
              <span>{isLiked ? "13 familias y profes (Tú)" : post.likesLabel}</span>
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-colors"
              onClick={() =>
                onNotify?.("Foto añadida al Álbum Familiar del Trimestre")
              }
              type="button"
            >
              <Icon name="bookmark_add" size={18} />
              {post.albumActionLabel}
            </button>
          </div>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary hover:text-on-secondary font-label-md text-label-md transition-all shadow-sm"
            onClick={focusTeacherMessage}
            type="button"
          >
            <Icon name="chat" size={18} />
            Responder a Elena M.
          </button>
        </div>
        {replyVisible && (
          <div className="pt-2">
            <div className="flex items-center gap-2 bg-surface-container-low p-2 rounded-2xl">
              <input
                aria-label="Escribe una nota cariñosa a la tutora"
                className="flex-1 bg-transparent px-3 py-1.5 font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline"
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Escribe una nota cariñosa a la tutora..."
                type="text"
                value={replyText}
              />
              <button
                className="px-4 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary transition-colors"
                onClick={sendTeacherMessage}
                type="button"
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}