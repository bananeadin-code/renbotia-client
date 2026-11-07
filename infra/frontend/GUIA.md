# Migrar el sitio de RenBotIA de Vercel a AWS (S3 + CloudFront) con Terraform

Guía paso a paso para alguien que **nunca ha usado Terraform** y conoce lo básico de la consola de AWS.
Al terminar, `renbotia.com` se servirá desde AWS y **todo lo demás sigue igual**: el servidor en Render,
Stripe, MongoDB, Meta, Google y Cloudflare (DNS).

> Tiempo estimado: 1 a 2 tardes. Ninguno de los pasos 1 a 8 afecta al sitio en producción:
> el sitio solo cambia de casa en el **paso 9**, y se puede regresar a Vercel en un minuto.

---

## 0. Qué vamos a construir

```
Visitante ──► CloudFront (CDN de AWS, ubicación más cercana: México / EE. UU.)
                 │
                 ├─ Enrutador (CloudFront Function, se ejecuta en cada visita, en el borde)
                 │     • www.renbotia.com → renbotia.com
                 │     • /api/* → api.renbotia.com (salvo media y widget)
                 │     • páginas para Google → su HTML pregenerado
                 │     • panel, login y lo demás → la app (app.html)
                 │
                 ├─► S3 (privado)         archivos del sitio (npm run build)
                 └─► Render               /api/media/* y /api/widget/public/*
```

| Hoy (Vercel)                         | Mañana (AWS)                                          |
| ------------------------------------ | ----------------------------------------------------- |
| Alojamiento                          | S3 privado (solo CloudFront lo lee)                   |
| `rewrites` y `redirects` de vercel.json | Enrutador (CloudFront Function) + 2 orígenes          |
| `headers` de vercel.json (CSP, HSTS…) | Response Headers Policies                             |
| SSL automático                       | Certificado ACM (gratis)                              |
| Deploy en cada push                  | GitHub Actions (sin llaves de AWS guardadas: OIDC)    |
| Plan Hobby (no permite uso comercial) | ~0 a 2 USD/mes con el tráfico actual                  |

**Costo**: CloudFront incluye cada mes, de forma permanente, 1 TB de transferencia, 10 millones de
solicitudes y 2 millones de ejecuciones de funciones. S3 cuesta centavos por los pocos MB del sitio.
El certificado es gratis. Se agrega una alerta de gasto (paso 3) por si algo se sale de lo esperado.

---

## 1. Terraform en 5 minutos

Terraform lee archivos `.tf` que **describen cómo debe quedar** tu infraestructura y hace los cambios
necesarios en AWS para que quede así. En lugar de 40 clics en la consola, el diseño queda escrito,
versionado en git y se puede repetir idéntico.

| Comando              | Qué hace                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| `terraform init`     | Descarga el "proveedor" de AWS. Una vez por carpeta (o al cambiar versiones). |
| `terraform fmt`      | Acomoda el formato de los archivos.                                      |
| `terraform validate` | Revisa que la sintaxis sea correcta (no toca AWS).                        |
| `terraform plan`     | **Muestra** qué crearía, cambiaría o borraría. No hace nada. Léelo siempre. |
| `terraform apply`    | Hace los cambios (te muestra el plan y pide escribir `yes`).              |
| `terraform output`   | Muestra los datos de salida (IDs, dominios, registros para Cloudflare).   |
| `terraform destroy`  | Borra todo lo que creó esta carpeta.                                      |

Cómo leer un `plan`: `+` crear, `~` modificar, `-` borrar, `-/+` reemplazar (borra y crea).
**Si ves `-` o `-/+` en algo que no esperabas, no apliques y pregunta.**

**El estado** (`terraform.tfstate`): es la memoria de Terraform (qué creó y con qué ID). Al principio vive
en tu computadora; en el paso 11 lo pasamos a S3. No se sube a git (ya está en `.gitignore`).

### Qué es cada archivo de esta carpeta

| Archivo                     | Para qué sirve                                                                 |
| --------------------------- | ------------------------------------------------------------------------------ |
| `versions.tf`               | Versión de Terraform y del proveedor de AWS, región y etiquetas automáticas.   |
| `variables.tf`              | Los datos configurables (dominio, repo de GitHub, correo de alertas…).         |
| `terraform.tfvars.example`  | Plantilla de tus valores. La copias como `terraform.tfvars` (no se sube a git). |
| `s3.tf`                     | El bucket privado donde viven los archivos del sitio, cifrado y con versiones. |
| `cloudfront.tf`             | La distribución (CDN), sus orígenes (S3 y Render), reglas por ruta y el enrutador. |
| `headers.tf`                | Encabezados de seguridad: CSP, HSTS, X-Frame-Options… (copiados de vercel.json). |
| `acm.tf`                    | El certificado SSL de renbotia.com y www.                                       |
| `github-oidc.tf`            | El permiso para que GitHub Actions despliegue sin llaves guardadas.            |
| `budget.tf`                 | Alerta por correo si el gasto del mes se acerca a tu límite.                   |
| `outputs.tf`                | Los datos que necesitas después (para Cloudflare y GitHub).                    |
| `edge-router.js`            | El enrutador. **Generado** por `scripts/gen-edge-router.mjs`; no se edita a mano. |
| `.terraform.lock.hcl`       | Fija la versión exacta del proveedor descargado (sí se sube a git).            |

---

## 2. Seguridad de la cuenta de AWS (consola, una sola vez)

Antes de crear nada, asegura la cuenta. Esto se hace en la **consola** porque es justamente lo que
protege a todo lo demás.

1. **MFA en el usuario raíz** (el correo con el que abriste la cuenta):
   menú de tu cuenta (arriba a la derecha) → *Security credentials* → *Assign MFA device*.
   Usa una app de autenticación o una llave física. Si el raíz tiene *Access keys*, **bórralas**.
2. **No uses el usuario raíz para trabajar.** Crea tu usuario de trabajo con **IAM Identity Center**:
   1. Busca *IAM Identity Center* → *Enable* (región `us-east-1`).
   2. *Users* → *Add user* → tu nombre y correo. Activa MFA para él (*Settings → Authentication*).
   3. *Permission sets* → *Create* → *Predefined* → `AdministratorAccess`, duración de sesión 4 h.
   4. *AWS accounts* → selecciona tu cuenta → *Assign users* → tu usuario + ese permission set.
   5. Guarda la *AWS access portal URL* que aparece en el panel (algo como `https://d-xxxx.awsapps.com/start`).
3. **Conecta la terminal con credenciales temporales** (no llaves permanentes). En PowerShell:
   ```powershell
   aws configure sso
   # SSO session name: renbotia
   # SSO start URL: (la access portal URL del paso anterior)
   # SSO region: us-east-1
   # (se abre el navegador; autoriza)
   # Default client Region: us-east-1   ·   Output format: json   ·   Profile name: renbotia
   ```
   Cada vez que trabajes:
   ```powershell
   aws sso login --profile renbotia
   $env:AWS_PROFILE = "renbotia"
   aws sts get-caller-identity   # debe mostrar tu usuario, no "root"
   ```

> **Por qué AdministratorAccess y no algo más pequeño:** Terraform aquí crea recursos de S3, CloudFront,
> ACM, IAM (el rol de GitHub) y Budgets. Para una sola persona administradora es aceptable, porque las
> credenciales son **temporales** (expiran solas) y protegidas con **MFA**. Los permisos mínimos sí los
> aplicamos a lo que corre solo: el rol de GitHub (ver sección 12).

---

## 3. Preparar la carpeta

En PowerShell, desde la carpeta del cliente (`renbotia-client`):

```powershell
cd infra\frontend
copy terraform.tfvars.example terraform.tfvars
notepad terraform.tfvars      # pon tu correo en budget_email; deja attach_domain = false
node ..\..\scripts\gen-edge-router.mjs   # genera edge-router.js (Terraform lo necesita)
terraform init
terraform validate
```

Si ya habías creado antes el proveedor OIDC de GitHub en esta cuenta (IAM → *Identity providers* →
`token.actions.githubusercontent.com`), pon `create_github_oidc_provider = false`.

---

## 4. Crear la infraestructura (sin tocar el dominio)

```powershell
terraform plan
```

Debe decir **`Plan: 18 to add, 0 to change, 0 to destroy`** (todo con `+`). Revisa que
aparezcan: el bucket, la distribución de CloudFront, la función `renbotia-edge-router`, las tres
políticas de encabezados, el certificado, el rol `renbotia-frontend-deploy` y el presupuesto.

```powershell
terraform apply      # escribe: yes
```

CloudFront tarda **5 a 15 minutos** en crearse; es normal. Al terminar:

```powershell
terraform output
```

Anota `cloudfront_domain` (algo como `d1abcd2efgh3.cloudfront.net`). AWS te enviará un correo para
**confirmar la suscripción** a la alerta de presupuesto: confírmalo.

Ve a la consola y míralo: *CloudFront → Distributions*, *S3 → Buckets*, *CloudFront → Functions*.
Así relacionas lo que escribiste en código con lo que existe.

---

## 5. Primer despliegue (GitHub Actions)

### 5.1 Variables en GitHub

En GitHub → repo `renbotia-client` → *Settings → Secrets and variables → Actions* → pestaña **Variables**
→ *New repository variable*. Son **variables** (no secretos): ninguna es una contraseña.

| Variable                         | Valor                                                       |
| -------------------------------- | ----------------------------------------------------------- |
| `AWS_DEPLOY_ROLE_ARN`            | `terraform output -raw deploy_role_arn`                     |
| `AWS_S3_BUCKET`                  | `terraform output -raw bucket_name`                         |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | `terraform output -raw distribution_id`                     |
| `AWS_CF_FUNCTION_NAME`           | `terraform output -raw router_function_name`                |
| `VITE_API_URL`                   | El mismo valor que tienes en Vercel (*Settings → Environment Variables*). |
| `VITE_GTM_ID`                    | El de Vercel, si ya lo configuraste (si no, déjalo vacío o no lo crees). |

### 5.2 Subir el código y correr el despliegue

Sube a `main` los archivos nuevos (`infra/frontend/`, `scripts/gen-edge-router.mjs`,
`.github/workflows/deploy-aws.yml`). **No afecta a Vercel**: el workflow solo corre a mano.

En GitHub → *Actions* → **Desplegar sitio en AWS** → *Run workflow* (rama `main`). Debe terminar en
verde en 2 a 4 minutos. Si falla, abre el paso en rojo: el mensaje casi siempre dice qué faltó
(ver sección 13).

---

## 6. Probar en el dominio de CloudFront

Abre `https://TU-CLOUDFRONT-DOMAIN` (el `cloudfront_domain`). Revisa:

- [ ] Inicio, `/precios`, `/blog`, `/soluciones/esteticas-y-barberias/durango`: cargan y se ven bien.
- [ ] Recargar estando en `/dashboard` o `/login` no da error (lo resuelve el enrutador).
- [ ] Una ruta inventada (`/soluciones/no-existe`) muestra la página de "no encontrado" de la app.
- [ ] `/sitemap.xml` y `/robots.txt` abren.

Encabezados y enrutador desde PowerShell (`curl.exe`, no `curl`):

```powershell
$cf = terraform output -raw cloudfront_domain
curl.exe -sI "https://$cf/precios"            # 200, content-security-policy, strict-transport-security, x-cache
curl.exe -sI "https://$cf/api/auth/me"        # 302 → https://api.renbotia.com/api/auth/me
curl.exe -sI "https://$cf/widget.js"          # access-control-allow-origin: *  ·  cache-control: max-age=300
```

Para los archivos de la app: F12 → *Network* → recarga → abre cualquier archivo de `/assets/`: su
`cache-control` debe decir `max-age=31536000, immutable` (se guardan un año; su nombre cambia en cada versión).

**Lo que todavía NO funciona aquí, y es normal:** iniciar sesión o usar el panel. El servidor solo
acepta peticiones del dominio `renbotia.com` (CORS), no de `*.cloudfront.net`. Eso se prueba en el paso 8.

---

## 7. Certificado SSL para renbotia.com

1. Muestra los registros de validación:
   ```powershell
   terraform output acm_validation_records
   ```
2. En **Cloudflare** → `renbotia.com` → *DNS* → *Add record*, por cada uno:
   tipo **CNAME**, nombre = `nombre` (sin el `.renbotia.com.` final si Cloudflare lo agrega solo),
   destino = `valor`, **Proxy: apagado (nube gris, "DNS only")**. Con el proxy encendido AWS no puede validar.
   (Si `renbotia.com` y `www` comparten el mismo registro, solo agregas uno.)
3. En la consola: *Certificate Manager* (región **us-east-1**) → el certificado pasa a **Issued** en
   5 a 30 minutos. Deja esos registros en Cloudflare para siempre: AWS los usa para renovarlo solo.
4. Asigna el dominio a CloudFront:
   ```powershell
   notepad terraform.tfvars      # attach_domain = true
   terraform plan                # ~ cambia la distribución (aliases y certificado). Nada se borra.
   terraform apply
   ```

Esto **todavía no mueve el tráfico**: el DNS sigue apuntando a Vercel.

---

## 8. Probar con el dominio real, sin cambiar el DNS (archivo hosts)

Truco profesional: hacer que **solo tu computadora** vea `renbotia.com` en AWS.

1. Obtén una IP de tu distribución: `nslookup TU-CLOUDFRONT-DOMAIN` (toma una de las *Addresses*).
2. Abre el Bloc de notas **como administrador** → abre `C:\Windows\System32\drivers\etc\hosts` → agrega al final:
   ```
   IP-DE-CLOUDFRONT   renbotia.com
   ```
3. Guarda y ejecuta `ipconfig /flushdns`. Abre una ventana de incógnito.
4. Comprueba que ya es AWS: `curl.exe -sI https://renbotia.com` debe mostrar `server: AmazonS3`
   o `via: ... (CloudFront)` y `x-cache`, en lugar de `server: Vercel`.
5. Prueba **todo** como cliente:
   - [ ] Iniciar sesión (correo y con Google) y navegar el panel; recargar en cualquier página.
   - [ ] Facturación abre el pago (no hace falta pagar) y Stripe carga sin errores.
   - [ ] Conexiones → el botón de WhatsApp abre la ventana de Meta.
   - [ ] El chat embebido en un sitio de cliente responde (usa `renbotia.com/w/...` y `/widget.js`).
   - [ ] Imágenes enviadas por el bot (`/api/media/...`) se ven.
   - [ ] Consola del navegador (F12): sin errores rojos de "Content Security Policy".
6. **Quita la línea del archivo hosts** al terminar y vuelve a correr `ipconfig /flushdns`.

---

## 9. El cambio: apuntar renbotia.com a AWS

1. En Cloudflare → *DNS*, **toma captura** de los registros actuales de `renbotia.com` y `www`
   (hoy: un registro A `renbotia.com → 216.198.79.1` y `www` hacia Vercel). Es tu plan para regresar.
2. Reemplázalos por:
   | Tipo  | Nombre | Destino                    | Proxy                  |
   | ----- | ------ | -------------------------- | ---------------------- |
   | CNAME | `@`    | `TU-CLOUDFRONT-DOMAIN`     | **apagado** (DNS only) |
   | CNAME | `www`  | `TU-CLOUDFRONT-DOMAIN`     | **apagado** (DNS only) |

   Cloudflare permite un CNAME en la raíz (`@`) gracias al "CNAME flattening". **No toques**
   `api.renbotia.com` ni los registros de correo.
3. En 1 a 5 minutos: `curl.exe -sI https://renbotia.com` debe mostrar CloudFront, y
   `curl.exe -sI https://www.renbotia.com` un `301` hacia `https://renbotia.com/`.
4. Vuelve a hacer una ronda corta del checklist del paso 8.

**Para regresar a Vercel** (si algo grave falla): restaura en Cloudflare los registros de tu captura.
En minutos el tráfico vuelve a Vercel. Por eso **no borres el proyecto de Vercel** todavía.

---

## 10. Activar el despliegue automático y retirar Vercel

1. En `.github/workflows/deploy-aws.yml` quita los `#` de:
   ```yaml
   push:
     branches: [main]
   ```
   Desde ahí, cada push a `main` publica en AWS.
2. Tras **2 semanas** sin problemas: en Vercel → tu proyecto → *Settings → Domains* quita
   `renbotia.com` y `www`, y luego *Settings → General → Delete Project*.
3. Después puedes borrar `vercel.json` del repo (su contenido ya vive en Terraform y en el enrutador).

---

## 11. Guardar el estado en S3 (recomendado)

Si tu computadora se pierde, pierdes `terraform.tfstate` y Terraform ya no sabe qué administra.

1. En la consola: *S3 → Create bucket* → nombre `renbotia-terraform-state-TUSUFIJO`, región
   `us-east-1`, **Block all public access** activado, **Bucket Versioning: Enable**, cifrado por defecto.
2. En `versions.tf`, quita los comentarios del bloque `backend "s3"` y pon el nombre del bucket.
3. ```powershell
   terraform init -migrate-state    # responde: yes
   ```
   Desde ahí el estado vive en S3 (con versiones) y `use_lockfile = true` evita que dos `apply`
   choquen. Ya puedes borrar el `terraform.tfstate` local.

---

## 12. Seguridad: qué protege a qué

### IAM (quién puede hacer qué)
- **Usuario raíz**: solo con MFA y sin llaves de acceso. No se usa en el día a día.
- **Tú (Identity Center)**: credenciales temporales que expiran (4 h) y MFA. Nada de llaves
  permanentes en tu computadora (`~/.aws/credentials` debe quedar vacío).
- **GitHub Actions (rol `renbotia-frontend-deploy`)**: principio de **mínimo privilegio**:
  - Solo lo puede usar el repo `bananeadin-code/renbotia-client` desde la rama `main`
    (condición `sub` del OIDC). Un fork o una rama de pruebas no puede desplegar.
  - Solo puede: subir/borrar archivos en **este** bucket, limpiar caché de **esta** distribución y
    actualizar **este** enrutador. No puede crear servidores, ver otros buckets ni tocar IAM.
  - Sin llaves guardadas en GitHub: cada despliegue recibe credenciales que duran minutos.
- Revisa de vez en cuando *IAM → Access Analyzer* (avisa si algo quedó expuesto públicamente) y
  *CloudTrail → Event history* (90 días de quién hizo qué, gratis).

### Conexiones privadas (red)
- **El bucket es privado.** No tiene acceso público (Block Public Access) y su política solo permite
  leer a CloudFront, **y solo a esta distribución** (condición `AWS:SourceArn`). CloudFront firma cada
  petición a S3 (Origin Access Control, firma SigV4). Si alguien descubre el nombre del bucket, no
  puede leer nada directo.
- **CloudFront → Render** viaja siempre por HTTPS con TLS 1.2 (`https-only`).
- **Visitante → CloudFront**: HTTPS obligatorio (HTTP redirige), TLS 1.2 mínimo, HTTP/2 y HTTP/3.
- **¿Y VPC, subredes privadas, NAT?** Un sitio estático no las necesita: no hay servidores propios que
  aislar. Esos conceptos entran cuando el **servidor** viva en AWS (base de datos en subred privada,
  balanceador público, etc.). Lo que sí aplicamos aquí es el equivalente: **el almacenamiento no es
  accesible desde internet, solo a través de la CDN**.

### Datos y navegador
- Cifrado en reposo (S3, AES-256) y versiones de 30 días para recuperar archivos.
- Encabezados: CSP (qué scripts y conexiones se permiten), HSTS 2 años con preload, `nosniff`,
  `X-Frame-Options: DENY` (nadie puede meter tu panel en un iframe; el chat `/w/` sí, a propósito).
- El sitio **no contiene secretos**: `VITE_API_URL` y `VITE_GTM_ID` son públicos por diseño.
  Contraseñas y llaves viven solo en Render.
- `terraform.tfstate` contiene IDs y configuración: no lo compartas ni lo subas a git.

### Gasto
- Alerta de AWS Budgets (paso 4) al 80 % estimado y al 100 % real. **Es aviso, no tope.**
- Si alguna vez llega un aviso inesperado: *Billing → Bills* y *Cost Explorer* muestran qué servicio
  generó el costo (todo lo de este proyecto lleva la etiqueta `Project = renbotia`).

---

## 13. Problemas comunes

| Síntoma | Causa y solución |
| ------- | ---------------- |
| Error XML `AccessDenied` al abrir una página | El archivo no existe en S3 (¿falló la subida?) o la ruta no la conoce el enrutador. Corre de nuevo el workflow. |
| `CNAMEAlreadyExists` al hacer `apply` con `attach_domain = true` | Otra distribución de CloudFront (de cualquier cuenta) ya usa `renbotia.com`. Revisa *CloudFront → Distributions* en tu cuenta. |
| El certificado se queda en *Pending validation* | Los CNAME de validación tienen el proxy de Cloudflare **encendido**, o el nombre quedó duplicado (`...renbotia.com.renbotia.com`). |
| GitHub: `Not authorized to perform sts:AssumeRoleWithWebIdentity` | Corriste el workflow desde otra rama, o `github_repository` no coincide con el repo. |
| GitHub: `PreconditionFailed` al actualizar el enrutador | Alguien lo editó en la consola al mismo tiempo. Vuelve a correr el workflow. |
| En la consola del navegador: "Refused to load … Content Security Policy" | Un servicio nuevo no está en la CSP. Agrégalo en `headers.tf` → `terraform apply`. La CSP no puede pasar de 1,783 caracteres. |
| Cambié algo y sigo viendo lo viejo | Caché del navegador (Ctrl+F5) o la invalidación aún corre (1 a 3 min). |
| `terraform plan` quiere cambiar algo que no tocaste | Alguien lo cambió en la consola. Lo correcto es cambiarlo en el código; Terraform es la fuente de verdad. |

---

## 14. Mantenimiento

- **Contenido nuevo** (artículo del blog, giro o ciudad): push a `main`. El workflow regenera las
  páginas para Google y el enrutador solo.
- **Encabezados, dominios o reglas de CloudFront**: edita el `.tf` → `terraform plan` → `terraform apply`.
- **Actualizar el proveedor de AWS** (cada pocos meses): `terraform init -upgrade` → `terraform plan`.
- **Para borrar todo** (si algún día te vas de AWS): vacía el bucket del sitio en la consola y corre
  `terraform destroy`.

---

## Glosario

- **CDN (CloudFront)**: red de servidores en muchas ciudades que guardan copias del sitio cerca del visitante.
- **Origen**: de dónde saca CloudFront el contenido (aquí: S3 y Render).
- **Comportamiento (cache behavior)**: regla por ruta (qué origen, qué caché, qué encabezados).
- **CloudFront Function**: código JavaScript pequeño que corre en cada visita, en el borde, antes de ir al origen.
- **Invalidación**: pedirle a CloudFront que deje de servir lo que tenía guardado.
- **OAC (Origin Access Control)**: permiso firmado para que CloudFront lea un bucket privado.
- **ACM**: servicio de certificados SSL de AWS (gratis para CloudFront).
- **IAM**: quién puede hacer qué en AWS. **Rol**: permisos que se "toman prestados" temporalmente.
- **OIDC**: forma de que GitHub demuestre su identidad a AWS sin compartir contraseñas ni llaves.
- **Identity Center (SSO)**: usuarios de trabajo con credenciales temporales y MFA.
- **Estado de Terraform**: el registro de qué recursos administra Terraform y sus IDs.
