-- SPEC 08 — Limpieza de las altas de verificación creadas durante la revisión
-- del spec desde la UI (una sesión de Elena Morales y otra de Camila Rivas).
-- child_health y child_allergies se eliminan en cascada desde children.
delete from public.children
where full_name in ('Lucía Prueba Spec08', 'Marcos Prueba Spec08');
