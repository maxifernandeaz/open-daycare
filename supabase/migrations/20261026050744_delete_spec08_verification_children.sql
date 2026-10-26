delete from public.children
where document in ('TEST-ELENA-01', 'TEST-CAMILA-01')
  and full_name in ('Verificación Elena Rivas', 'Verificación Camila Núñez');
