# Backlog — Ogbón

Ideas y mejoras pendientes de evaluar/priorizar. No es un compromiso; es el "compost"
de donde salen las próximas iteraciones.

## Pendientes

### 🎼 Vista de notación musical convencional
**Qué:** evaluar e implementar una representación del ritmo en **notación musical
convencional** (pentagrama / notación de percusión), ubicada **entre el círculo y las
ondas**. Tres lecturas del mismo ritmo: circular (intuición métrica), partitura (lectura
estándar) y onda (sonido).

**Por qué:** valor didáctico y de portafolio — tiende un puente entre el secuenciador
radial y la lectura musical tradicional; suma para músicos formados y para aprender a leer.

**A evaluar:**
- Notación de **percusión** (no melódica) para 4 voces (Gã, Rum, Rumpi, Lé), con cabezas
  distintas para golpe abierto vs cerrado.
- Soporte de métrica **ternaria (12/8)** y **cuaternaria (4/4)**.
- Sincronizar el cursor/playhead con la aguja del círculo.
- Opciones técnicas: **VexFlow** (estándar web, soporta percusión, ~peso a medir),
  **abcjs**, o render propio en SVG/Canvas (más liviano, más trabajo).
- Trade-off: peso del bundle vs fidelidad de la notación. Empezar por un spike chico.

**Dependencia cultural:** la notación "correcta" de cada toque también debería validarse
con la comunidad (ver `VALIDACION-CULTURAL.md`); mostrarla con el mismo disclaimer de
aproximación didáctica.

**Origen:** pedido de Martín, 2026-06-27.

---

## Ideas sueltas (sin desarrollar)
- Botón "generá una variación" con ritmos euclidianos (Bjorklund) para experimentar.
- Más toques built-in (avamunha, barravento) una vez validados.
- Compartir un ritmo por link (estado codificado en la URL, sin backend).
