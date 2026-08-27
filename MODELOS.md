# Revisión de modelos — agosto 2026

Precios sacados del catálogo **en vivo** de OpenRouter (`/api/v1/models`, 406 modelos) el 12 de agosto de 2026, no de memoria. Todo lo que hay aquí es comprobable volviendo a lanzar esa consulta, y los 23 ids del catálogo de la app están verificados con `yarn verify:models`.

::: warning Leed esto antes que las tablas
El precio que devuelve la API **no es el que necesariamente pagáis**. Dos motivos, ambos comprobados en la web de OpenRouter:

**1. Hay descuentos que la API no distingue.** `openai/gpt-5.6-luna` aparece a $0.10/$0.60, pero su ficha dice **"50% off"**: el precio de tarifa es $0.20/$1.20. Si acaba la promoción, se duplica.

**2. Cada modelo lo sirven varios proveedores y a precios distintos.** El campo `pricing` de la API es una cifra intermedia, no el mínimo ni el máximo:

| Modelo | API dice | Proveedor más barato | Más caro |
| --- | --- | --- | --- |
| `google/gemini-2.5-flash` | $0.30/$2.50 | $0.15/$1.25 | $0.54/$4.50 |
| `google/gemini-2.5-flash-lite` | $0.10/$0.40 | $0.05/$0.20 | $0.18/$0.72 |
| `openai/gpt-5.6-luna` | $0.10/$0.60 | $0.05/$0.30 | $0.22/$1.32 |
| `moonshotai/kimi-k3` | $3.00/$15.00 | $2.80/$14.00 | $6.00/$22.50 |
| `anthropic/claude-sonnet-5` | $2.00/$10.00 | $2.00/$10.00 | $2.20/$11.00 |

Hasta **3,6x de diferencia** entre proveedores del mismo modelo, según a cuál os enrute OpenRouter.

**Las comparaciones de este documento siguen siendo válidas** porque todas las cifras salen del mismo campo, así que las proporciones se mantienen. Lo que no debéis hacer es tomar los valores absolutos como vuestra factura. Para eso tenéis el dato real: `aiUsageService` guarda el coste que devuelve OpenRouter en cada llamada.
:::

---

## 0. Lo que ha cambiado en un día

Este documento se escribió ayer. Al reverificarlo hoy, **tres cosas se habían movido**, que es exactamente lo que avisaba el último apartado:

**El descuento de Luna se acabó.** `openai/gpt-5.6-luna` está ahora a **$0.20/$1.20**, su tarifa de lista. Las tablas de abajo lo muestran a $0.10/$0.60 con un "50% off" que ya no existe. Sigue siendo más barato que el modelo por defecto ($14 vs $24.50 por 1.000 reuniones), pero deja de ser el líder de precio.

**DeepSeek R1 perdió proveedores.** Pasó de 163.840 de contexto a **64.000**, porque se quedó con un único proveedor. El valor que yo había puesto (160.000) se volvió incorrecto en menos de 24 horas.

**Salieron modelos nuevos**, uno de ellos esta misma semana:

| Modelo | Precio | Contexto | Lanzado | Qué sustituye |
| --- | --- | --- | --- | --- |
| `google/gemini-3.7-flash` | $0.38/$1.88 | 1.048.576 | **esta semana** | más barato y 14 meses más nuevo que el default |
| `deepseek/deepseek-v4-flash` | $0.08/$0.17 | 384k–1M | 2026-04 | a V3.2: 3x más barato, 6x más contexto |
| `x-ai/grok-4.6` | $2.00/$6.00 | 500.000 | 2026-08 | a Grok 4.5, mismo precio |

Los tres están ya en el catálogo, y V3.2 y Grok 4.5 fuera.

### Y una trampa que casi entra

`deepseek-v4-flash` anuncia **1.048.576** de contexto, pero lo sirven **17 proveedores y el más pequeño tope en 384.000**. La cifra de cabecera es lo que ofrece la mejor ruta, no lo que aguanta cualquiera. Está declarado a 380.000.

`yarn verify:models` habría dado el visto bueno a 1M, porque solo miraba la cabecera. Ahora también mira el **mínimo por proveedor** y avisa cuando el declarado lo supera. No lo hace fallar —OpenRouter normalmente descarta proveedores demasiado pequeños para la petición— pero sí lo señala, porque en la ruta que **fija el proveedor** (`allow_fallbacks: false`, la de contexto cacheado) no hay reenrutado que te salve.

Con ese aviso salieron a la luz tres más que ya estaban: GLM-5.2 (mínimo 202.752), MiniMax M3 (256.000) y Llama 3.3 (**12.288** frente a los 130.000 declarados).

---

## 1. Qué usáis hoy

De `plan-ai/backend/src/utils/aiModelUtils.ts`, con los precios de hoy por millón de tokens:

| Uso | Modelo | Entrada | Salida | Contexto |
| --- | --- | --- | --- | --- |
| Default / Fast | `google/gemini-2.5-flash` | $0.30 | $2.50 | 1.048.576 |
| Tickets (extracción) | `google/gemini-2.5-flash` | $0.30 | $2.50 | 1.048.576 |
| Documentos | `google/gemini-2.5-flash` | $0.30 | $2.50 | 1.048.576 |
| Slides | `google/gemini-2.5-flash` | $0.30 | $2.50 | 1.048.576 |
| Contexto grande (repo) | `google/gemini-2.5-flash` | $0.30 | $2.50 | 1.048.576 |
| **Diagramas Mermaid** | `anthropic/claude-sonnet-4.6` | $3.00 | $15.00 | 1.000.000 |
| Fallback 1 | `openai/gpt-4o-mini` | $0.15 | $0.60 | 128.000 |
| Fallback 2 | `openai/gpt-4.1-mini` | $0.40 | $1.60 | 1.047.576 |
| Fallback 3 | `anthropic/claude-sonnet-4.6` | $3.00 | $15.00 | 1.000.000 |
| Embeddings | `openai/text-embedding-3-small` | $0.02 | — | — |
| Imágenes | `black-forest-labs/flux.2-klein-4b` | $3.42/M tok imagen | — | — |

Embeddings e imágenes **siguen vivos**. No aparecen en el listado principal de `/models` porque ese endpoint solo lista modelos de chat — lo comprobé pidiendo sus endpoints uno a uno, no dando por hecho que la ausencia significara baja.

---

## 2. Lo primero: Kimi K3 no es lo que esperabas

Me pediste mirar Kimi 3 en concreto. Está, y **cuesta $3 / $15 por millón** — exactamente lo mismo que Claude Sonnet 4.6. No es un modelo barato: es gama frontera.

| Modelo | Entrada | Salida | Contexto | json_schema |
| --- | --- | --- | --- | --- |
| `moonshotai/kimi-k3` | $3.00 | $15.00 | 1.048.576 | sí |
| `moonshotai/kimi-k2.7-code` | $0.70 | $3.50 | 262.144 | sí |
| `moonshotai/kimi-k2.6` | $0.58 | $2.44 | 262.144 | sí |
| `moonshotai/kimi-k2.5` | $0.57 | $2.85 | 262.144 | sí |
| `moonshotai/kimi-k2` | $0.57 | $2.30 | 131.072 | **NO** |

En vuestro escenario K3 saldría **8 veces más caro** que lo que usáis ahora, y el K2 más barato sale un 44% por encima de Gemini 2.5 Flash. Ninguno de la familia mejora vuestro coste.

Kimi tendría sentido si necesitarais su calidad concreta para algo. Para extraer tickets con un esquema JSON, no la necesitáis.

---

## 3. El hallazgo que sí importa

Vuestro caso es **entrada pesada, salida ligera**: se le mete una transcripción larga (más el contexto inyectado) y sale un JSON corto. Con ese perfil, el precio de entrada manda.

Escenario de una reunión de 60 min: ~40.000 tokens de entrada y ~5.000 de salida acumulados entre todas las llamadas del pipeline.

| Modelo | Entrada | Salida | Contexto | $/1.000 reuniones | vs actual |
| --- | --- | --- | --- | --- | --- |
| **`google/gemini-2.5-flash-lite`** | $0.10 | $0.40 | 1.048.576 | **$6.00** | **−76%** |
| **`openai/gpt-5.6-luna`** | $0.10 | $0.60 | 1.050.000 | **$7.00** | **−71%** |
| `meta-llama/llama-3.3-70b-instruct` | $0.10 | $0.32 | 131.072 | $5.60 | −77% |
| `openai/gpt-5.4-nano` | $0.20 | $1.25 | 400.000 | $14.25 | −42% |
| `deepseek/deepseek-v3.2` | $0.27 | $0.40 | 163.840 | $12.76 | −48% |
| `google/gemini-3.1-flash-lite` | $0.25 | $1.50 | 1.048.576 | $17.50 | −29% |
| `openai/gpt-5-mini` | $0.25 | $2.00 | 400.000 | $20.00 | −18% |
| `minimax/minimax-m3` | $0.30 | $1.20 | 1.048.576 | $18.00 | −27% |
| `z-ai/glm-5.2` | $0.41 | $1.27 | 1.048.576 | $22.54 | −8% |
| `google/gemini-2.5-flash` ← **actual** | $0.30 | $2.50 | 1.048.576 | $24.50 | — |
| `google/gemini-3.5-flash-lite` | $0.30 | $2.50 | 1.048.576 | $24.50 | 0% |
| `moonshotai/kimi-k2.6` | $0.58 | $2.44 | 262.144 | $35.38 | +44% |
| `qwen/qwen3-max` | $0.78 | $3.90 | 262.144 | $50.70 | +107% |
| `anthropic/claude-haiku-4.5` | $1.00 | $5.00 | 200.000 | $65.00 | +165% |
| `x-ai/grok-4.5` | $2.00 | $6.00 | 500.000 | $110.00 | +349% |
| `anthropic/claude-sonnet-5` | $2.00 | $10.00 | 1.000.000 | $130.00 | +431% |
| `google/gemini-3.1-pro-preview` | $2.00 | $12.00 | 1.048.576 | $140.00 | +471% |
| `openai/gpt-5.4` | $2.50 | $15.00 | 1.050.000 | $175.00 | +614% |
| `anthropic/claude-sonnet-4.6` | $3.00 | $15.00 | 1.000.000 | $195.00 | +696% |
| `moonshotai/kimi-k3` | $3.00 | $15.00 | 1.048.576 | $195.00 | +696% |
| `anthropic/claude-opus-5` | $5.00 | $25.00 | 1.000.000 | $325.00 | +1226% |
| `openai/gpt-5.5` | $5.00 | $30.00 | 1.050.000 | $350.00 | +1329% |

Todos soportan `structured_outputs`, que es requisito no negociable del pipeline. El contexto es el real del catálogo, no el que declara nadie.

Los tres candidatos serios:

**`google/gemini-2.5-flash-lite`** — $0.10 / $0.40, 1M de contexto, json_schema. **Mi recomendación.** Misma familia que ya usáis, así que es el cambio de menor riesgo: mismo tokenizador, mismo comportamiento con esquemas, mismo caché implícito de Google del que ya os aprovecháis en la ruta de contexto grande. Y a diferencia de Luna, **su precio no lleva descuento** — es tarifa real, así que el ahorro no se evapora cuando acabe una promoción.

Un apunte honesto: salió en julio de 2025 y su corte de conocimiento es enero de 2025. Para vuestro caso da igual —procesa la transcripción que le dais, no necesita saber del mundo— pero conviene saberlo.

**`openai/gpt-5.6-luna`** — $0.10 / $0.60, 1.05M de contexto, json_schema. Generación mucho más nueva por el mismo dinero. **Pero ese precio es una promoción del 50%**: la tarifa es $0.20/$1.20, y así lo dice su ficha en la web. Sospeché de ello porque sus variantes `:batch` cuestan lo mismo que las normales —cosa que no pasa con ningún otro modelo— y al mirar la web quedó confirmado. A tarifa completa sigue siendo más barato que lo que usáis hoy, pero deja de ser el líder. No montaría la estructura de costes encima sin vigilar cuándo acaba.

**`google/gemini-3.1-flash-lite`** — $0.25 / $1.50. Más caro que los dos anteriores pero de generación posterior a lo que usáis, y aun así un 29% más barato que hoy. Es la opción conservadora si los otros dos flojean en calidad.

---

## 4. Diagramas: aquí hay dinero fácil

Los diagramas usan Sonnet 4.6 a $3/$15. La decisión está bien razonada en el código —Mermaid es de sintaxis estricta y un error deja el diagrama sin renderizar— pero el catálogo ha cambiado desde entonces:

| Modelo | $/diagrama | vs actual |
| --- | --- | --- |
| `anthropic/claude-sonnet-4.6` ← actual | $0.0465 | — |
| `anthropic/claude-sonnet-5` | $0.0310 | −33% |
| `anthropic/claude-haiku-4.5` | $0.0155 | −67% |
| `google/gemini-3.1-flash-lite` | $0.0043 | −91% |

**Sonnet 5 existe y cuesta $2/$10 en vez de $3/$15.** Misma familia, generación posterior, un tercio más barato. Es el cambio más seguro de todo este documento: mismo proveedor, mismo comportamiento, menos dinero.

---

## 5. Los fallbacks están viejos

```
FALLBACK_MODELS = ["openai/gpt-4o-mini", "openai/gpt-4.1-mini", "anthropic/claude-sonnet-4.6"]
```

`gpt-4o-mini` se eligió como "gold standard for json_schema, cheap & fast". Hoy `gpt-5.6-luna` lo domina en todo: más barato en entrada ($0.10 vs $0.15), mismo precio de salida, y **1.050.000 de contexto frente a 128.000**.

Ese salto de contexto no es cosmético. Si el modelo principal falla en una reunión larga con contexto inyectado, hoy el fallback puede no tener sitio para el prompt — falla el fallback justo cuando más falta hace.

---

## 5 bis. La lista que ve el usuario tenía un bug

`AI_MODEL_LIMITS` (en `aiContextRouter.ts`) es el catálogo que se muestra en el selector de modelos. Su campo `maxTokens` no es decorativo: es lo que decide si el router **inyecta el contexto entero o cae a RAG**.

Al validarlo contra el catálogo real apareció esto:

| Modelo | Declaraba | Real | |
| --- | --- | --- | --- |
| `minimax/minimax-m2.7` | 1.000.000 | **204.800** | ⚠ casi 5x de más |
| `deepseek/deepseek-r1` | 64.000 | 163.840 | desperdicia 100k |
| `google/gemini-3.1-pro-preview` | 1.050.000 | 1.048.576 | 1.424 de más |

El de MiniMax es un fallo de verdad: quien eligiera ese modelo con un contexto grande hacía que el router construyera un prompt cinco veces mayor de lo que el proveedor acepta. No falla de forma visible — falla al llamar, y encima con un modelo que vuestro propio código ya había marcado como poco fiable.

Corregidos los tres, y M2.7 sustituido por **M3**, que sí tiene el millón de contexto por un precio parecido.

### Un modelo sin filtros

`nousresearch/hermes-3-llama-3.1-70b` — 131k de contexto, `structured_outputs`, ~$0.70/$0.70 por millón.

Está porque un modelo con alineamiento de seguridad a veces **se niega a resumir una reunión legítima**: un incidente de seguridad, un caso de RRHH, una disputa legal, o simplemente lenguaje crudo. Negarse ante una grabación que el usuario ya posee no protege a nadie, solo rompe el producto. Hermes obedece el system prompt en vez de aplicar juicios propios.

Deliberadamente **no** es uno de los fine-tunes "uncensored" de rol (Dolphin Venice, Magnum, MythoMax, Euryale…). Esos están hechos para ficción, extraen mal, y el más conocido —`cognitivecomputations/dolphin-mistral-24b-venice-edition`— **no soporta `structured_outputs`**: meterlo en el selector rompería en silencio la extracción de tickets de quien lo eligiera. El guardarraíl `yarn verify:models` lo rechaza por eso mismo.

En el selector se distingue con la etiqueta **Sin censura** en color de aviso, no como una capacidad más: elegirlo es una decisión consciente.

El catálogo pasa de 8 a 23 modelos, organizados en cuatro gamas —económica, equilibrada, potente y frontera— más los de pesos abiertos, con el precio escrito en cada descripción para que se pueda decidir sin salir de la app. Cubre 11 proveedores distintos, así que una caída de uno no deja a nadie sin alternativa en su gama.

Hay un test (`aiModelCatalogue.spec.ts`) que ahora impide volver a declarar más contexto del real, y que obliga a apuntar el contexto verificado al añadir cualquier modelo — el paso que se saltó con MiniMax.

---

## 6. Propuesta

**Fase 1 — sin riesgo. ✅ Hecha.**

- Diagramas: `claude-sonnet-4.6` → **`claude-haiku-4.5`**. De $3/$15 a $1/$5, un **67% menos**. El motivo está en el apartado 4: un diagrama con Sonnet costaba el doble que procesar la reunión entera, y la capa `repairMermaidSyntax` del frontend ya absorbe los deslices de sintaxis que hacían falta a Sonnet para evitar. Haiku mantiene la familia Anthropic y 200k de contexto sobran para un diagrama.
- `FAST_AI_MODEL`: `gemini-2.5-flash` → **`gemini-2.5-flash-lite`**. Era **el mismo modelo que el default**, o sea una constante que mentía: el chat, el worker de documentos de contexto y el agente de Telegram pagaban tarifa de default sin ganar nada. Ahora es de verdad la gama de abajo, misma familia, ~70% menos por llamada.
- Cadena de fallback entera, que estaba anclada en modelos de 2024:

  | | antes | ahora | por qué |
  | --- | --- | --- | --- |
  | 1 | `gpt-4o-mini` (128k) | `gpt-5.6-luna` (1.05M) | el contexto, no el precio |
  | 2 | `gpt-4.1-mini` (1.04M) | `gpt-5-mini` (400k) | generación nueva, muy fiable con esquemas |
  | 3 | `claude-sonnet-4.6` | `claude-sonnet-5` | −33%, mismo comportamiento |

De paso, `diagramGenerationService.ts` tenía el string `"anthropic/claude-sonnet-4.6"` escrito a mano dos veces como valor por defecto del registro de uso. Ahora usa la constante, así que no se puede volver a desincronizar del modelo que realmente se llama.

Un matiz sobre los fallbacks: aquí **el contexto importa más que el precio**. Se usan poco, pero se usan en las peticiones más difíciles. `gpt-4o-mini` estaba ahí por barato y con 128k — o sea que se quedaba sin sitio justo en las reuniones largas con contexto inyectado, que son las que hacen fallar al modelo principal. Fallaba exactamente cuando hacía falta.

Y hay una regla que ahora fija un test: **ningún fallback puede ser del mismo proveedor que el modelo principal**. El principal es Google; un fallback de Google se cae con él y no sirve de nada. Por eso la cadena es OpenAI + Anthropic.

**Fase 1b, el default a Gemini 3.7 Flash. ✅ Hecha.**

`DEFAULT_AI_MODEL`, `TICKET_MODEL`, `DOC_MODEL`, `SLIDE_MODEL` y `CACHED_CONTEXT_MODEL` pasan de `gemini-2.5-flash` a **`gemini-3.7-flash`**. Catorce meses más nuevo por prácticamente el mismo dinero.

El precio se mueve en direcciones opuestas: la entrada sube ($0.300 a $0.375 por millón) y la salida baja ($2.500 a $1.875). El punto de cruce está en una proporción entrada:salida de 8,3 a 1:

| entrada:salida | 2.5 Flash | 3.7 Flash | diferencia |
| --- | --- | --- | --- |
| 5:1 | $20.00 | $18.75 | −6,2% |
| 8:1 | $24.50 | $24.38 | −0,5% |
| 10:1 | $27.50 | $28.12 | +2,3% |
| 20:1 | $42.50 | $46.88 | +10,3% |

(por cada 1.000 reuniones, con 5.000 tokens de salida)

Mi estimación de vuestro perfil es 8:1, o sea justo en la raya. El peor caso realista es un 10% más caro. Esto se puede dejar de estimar: la consulta del apartado 7 saca la proporción real de `AiUsageLog`.

Mismo millón de contexto y misma familia, así que el tokenizador, el comportamiento con `json_schema` y el caché implícito de Google se mantienen. Eso último importa para `CACHED_CONTEXT_MODEL`, que fija el proveedor con `allow_fallbacks: false`: `yarn verify:models` confirma 6 proveedores y ninguno con la ventana recortada, que es la condición para poder fijarlo.

De paso salió otro string escrito a mano. La investigación agéntica de `projectTranscriptService.ts` tenía `"google/gemini-2.5-flash"` repetido tres veces (dos de ellas antes de declarar la constante que lo guardaba), así que se habría quedado atrás sin que nadie lo notara. Ahora usa `DEFAULT_AI_MODEL`.

**Lo que sigo sin tocar, a propósito:** bajar esas mismas constantes a `gemini-2.5-flash-lite`. Ahí está el 76% de ahorro, y ahí es donde un modelo que falle con el `json_schema` os rompe los tickets. Eso pasa por la evaluación de la Fase 2, no por mi criterio. Moverse a 3.7 es cambiar de generación dentro de la misma gama; bajar a Lite es cambiar de gama, y eso sí hay que medirlo.

Los tests que quedan escritos son la red: fijan que ningún modelo declare más contexto del real, que la cadena de fallback no comparta proveedor con el principal, que ningún fallback baje de 200k de contexto, que `FAST` no vuelva a ser igual que el default, y que todo modelo enrutado exista en el catálogo. Más `yarn verify:models`, que comprueba contra OpenRouter que los 21 ids existen, son enrutables y soportan `json_schema`.

**Fase 2 — el grueso del ahorro, con evaluación de por medio.**

Cambiar `TICKET_MODEL`, `DOC_MODEL`, `SLIDE_MODEL` y `DEFAULT_AI_MODEL` a `gemini-2.5-flash-lite` baja el coste un 76%. Pero **no lo haría a ciegas**, y el motivo está escrito en vuestro propio código:

> *Gemini 2.5 Flash is the cheap + reliable default […] ~same cost as minimax but far more dependable on json_schema*

Ya os pasó una vez: un modelo igual de barato que fallaba con los esquemas. Un modelo que se equivoca en el JSON no es más barato — cuesta reintentos, tickets rotos y llamadas de soporte.

La evaluación no tiene por qué ser cara. Coged 20 transcripciones reales variadas —cortas, largas, en catalán, con mucha gente— pasadlas por los candidatos y medid dos cosas: **cuántas veces sale un JSON válido a la primera** y **si los tickets sirven**. Lo primero es automático, lo segundo lo miras tú en media hora.

**Fase 3 — medir antes de seguir adivinando.**

`aiUsageService` ya guarda el **coste real** que devuelve OpenRouter, más los tokens servidos de caché. O sea que no hace falta que mi estimación de 40.000/5.000 tokens sea buena: tenéis el dato de verdad. Sacad de esa tabla el reparto real entrada/salida por tipo de tarea y el gasto por modelo, y la decisión deja de ser una tabla teórica.

Y `CACHED_CONTEXT_MODEL` merece mirada aparte antes de tocarlo: fijáis el proveedor (`allow_fallbacks: false`) para reaprovechar el caché implícito de Google. Ese caché puede valer más que la diferencia de precio del modelo. Con los tokens cacheados que ya registráis se puede comprobar si está funcionando.

---

## 7. Medir la proporción real entrada:salida

Toda la comparación de arriba depende de un número que estoy estimando: cuántos tokens de entrada gastáis por cada uno de salida. `AiUsageLog` lo guarda por llamada, así que se puede saber en vez de suponer.

```sql
SELECT
  feature,
  model,
  count(*)                                             AS llamadas,
  sum("inputTokens")                                   AS entrada,
  sum("outputTokens")                                  AS salida,
  round(sum("inputTokens")::numeric
        / nullif(sum("outputTokens"), 0), 1)           AS ratio,
  round(sum("cachedTokens")::numeric * 100
        / nullif(sum("inputTokens"), 0), 1)            AS pct_cacheado,
  round(sum("estimatedCost")::numeric, 2)              AS coste_usd
FROM "AiUsageLog"
WHERE "createdAt" > now() - interval '30 days'
GROUP BY feature, model
ORDER BY coste_usd DESC;
```

Cómo leerlo: si la columna `ratio` sale **por debajo de 8,3** en las tareas que más gastan, 3.7 Flash os sale más barato que 2.5. Por encima, más caro, y la tabla del apartado 6 dice cuánto. La columna `pct_cacheado` es aparte pero interesa igual, porque los tokens de caché de Google se facturan a una fracción y si ese porcentaje es alto la entrada pesa bastante menos de lo que parece.

Merece la pena mirarlo por `feature`, no solo en total. La extracción de tickets y la generación de documentos tienen perfiles muy distintos: una mete la transcripción entera y devuelve una lista corta, la otra devuelve páginas. Puede salir a cuenta dejarlas en modelos diferentes.

---

## 8. Lo que no puedo decirte desde aquí

Todo lo anterior es **precio y capacidad**, dos cosas verificables. La calidad no lo es.

Puedo afirmar que `gemini-2.5-flash-lite` cuesta un 76% menos y declara soporte de `structured_outputs` con 1M de contexto. **No** puedo afirmar que extraiga tickets igual de bien que el que usáis. Cualquiera que te diga lo contrario sin haberlo probado con vuestras transcripciones se lo está inventando.

De ahí que la Fase 1 sean cambios dentro de la misma familia (donde el riesgo de comportamiento es casi nulo) y la Fase 2 pase por evaluación.

Un aviso final de calendario: este documento envejece rápido, que es justo lo que decías. Entre `gpt-5` y `gpt-5.6` hay hoy más de veinte variantes en el catálogo. Merece la pena repetir esta consulta cada trimestre — son cinco minutos:

```bash
curl -s https://openrouter.ai/api/v1/models | python3 -c '
import sys, json
rows = [(m["id"], float(m["pricing"]["prompt"])*1e6, float(m["pricing"]["completion"])*1e6)
        for m in json.load(sys.stdin)["data"]
        if "structured_outputs" in (m.get("supported_parameters") or [])
        and float(m["pricing"]["prompt"] or 0) > 0
        and (m.get("context_length") or 0) >= 120_000
        and ":free" not in m["id"]]
for i, p, c in sorted(rows, key=lambda r: r[1]*8 + r[2])[:15]:
    print(f"{i:44} in ${p:>7.3f}  out ${c:>7.3f}")
'
```

Filtra por lo que de verdad os hace falta —`structured_outputs`, 120k+ de contexto, precio real— y ordena por coste mezclado con vuestro perfil de entrada pesada. Sin esos filtros la lista sale dominada por modelos que no sirven para el pipeline.
