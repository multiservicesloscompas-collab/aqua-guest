# Trabajo con alquiler de lavadoras

El sistema debe permitir registrar el alquiler de lavadoras, tanto pedidas al momento como agendadas para luego.

Exiten tres jornadas de alquiler

- Medio turno (8 horas desde el momento de entrega)
- Turno completo (24 horas desde el momento de entrega)
- Doble turno (48 horas desde el momento de entrega)

Cada turno debe poder ser seteable en el precio, basado en el cambio del dolar a bolivares

Por ejemplo:

- Medio turno representan 4$, el valor del dolar ese día 300 bs, precio final para el cliente 1200 bs
- Turno completo representan 6$, el valor del dolar ese día 320 bs, precio final para el cliente 1920 bs
- Doble turno representan 10$, el valor del dolar ese día 400 bs, precio final para el cliente 4000 bs

El valor del dolar puede o no cambiar a diario

## Calculos de horario de retiro

El sistema debe calcular los retiros de los alquileres basado en la hora de entrega y en horario laboral de la empresa.

Por ejemplo:

- Se entrega una alquiler a las 12 PM, media jornada (es decir, por 8 horas), el horario de retiro debe ser a las 8 PM, permitido por el horario laboral
- Se entrega una alquiler a las 4 PM, media jornada (es decir, por 8 horas), el horario de retiro debe ser a al día siguiente a primera hora (9 AM), porque el horario de retiro quedaría a las 12 AM, no permitido por el horario laboral
