# Revisión de modelos — agosto 2026

Precios sacados del catálogo **en vivo** de OpenRouter (`/api/v1/models`, 406 modelos) el 12 de agosto de 2026, no de memoria. Todo lo que hay aquí es comprobable volviendo a lanzar esa consulta, y los 21 ids del catálogo de la app están verificados con `yarn verify:models`.

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

El catálogo pasa de 8 a 21 modelos, organizados en cuatro gamas —económica, equilibrada, potente y frontera— más los de pesos abiertos, con el precio escrito en cada descripción para que se pueda decidir sin salir de la app. Cubre 10 proveedores distintos, así que una caída de uno no deja a nadie sin alternativa en su gama.

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

**Lo que NO he tocado, a propósito:** `TICKET_MODEL`, `DOC_MODEL`, `SLIDE_MODEL`, `DEFAULT_AI_MODEL` y `CACHED_CONTEXT_MODEL`. Ahí está el 76% de ahorro, y ahí es donde un modelo que falle con el `json_schema` os rompe los tickets. Eso pasa por la evaluación de la Fase 2, no por mi criterio. Cambiar lo demás sin medir sería justo el error que este documento avisa de no cometer.

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

## 7. Lo que no puedo decirte desde aquí

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
