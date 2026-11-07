# Migrar el sitio de RenBotIA de Vercel a AWS (S3 + CloudFront) con Terraform

Guía paso a paso para alguien que **nunca ha usado Terraform** y conoce lo básico de la consola de AWS.
Al terminar, `renbotia.com` se servirá desde AWS y **todo lo demás sigue igual**: el servidor en Render,
Stripe, MongoDB, Meta y Google. El DNS pasa de Squarespace a Route 53 (el dominio sigue comprado en Squarespace).

> Tiempo estimado: 1 a 2 tardes, más 2 o 3 días de espera en el paso 7 (DNSSEC y propagación).
> Ninguno de los pasos 1 a 8 mueve el sitio de Vercel (el 7 cambia quién responde el DNS, con una
> copia exacta de los registros). El sitio solo cambia de casa en el **paso 9**, y se regresa a Vercel
> cambiando una línea.

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
| DNS en Squarespace                   | DNS en Route 53 (el dominio sigue en Squarespace)     |
| Plan Hobby (no permite uso comercial) | ~1 a 3 USD/mes con el tráfico actual                  |

**Costo**: CloudFront incluye cada mes, de forma permanente, 1 TB de transferencia, 10 millones de
solicitudes y 2 millones de ejecuciones de funciones. S3 cuesta centavos por los pocos MB del sitio.
El certificado es gratis. La zona de DNS en Route 53 cuesta ~0.50 USD al mes. Se agrega una alerta de gasto (paso 3) por si algo se sale de lo esperado.

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
| `terraform output`   | Muestra los datos de salida (IDs, dominios, servidores de nombres).       |
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
| `dns.tf`                    | La zona de Route 53 con todos los registros de renbotia.com, y a dónde apunta el sitio (Vercel o AWS). |
| `comparar-dns.ps1`          | Compara Squarespace contra Route 53 antes de cambiar los servidores de nombres. |
| `outputs.tf`                | Los datos que necesitas después (para Squarespace y GitHub).                   |
| `edge-router.js`            | El enrutador. **Generado** por `scripts/gen-edge-router.mjs`; no se edita a mano. |
| `.terraform.lock.hcl`       | Fija la versión exacta del proveedor descargado (sí se sube a git).            |

---

## 2. Seguridad de la cuenta de AWS (consola, una sola vez)

Antes de crear nada, asegura la cuenta. Esto se hace en la **consola** porque es justamente lo que
protege a todo lo demás.

1. **MFA en el usuario raíz** (el correo con el que abriste la cuenta):
   menú de tu cuenta (arriba a la derecha) → *Security credentials* → *Assign MFA device*.
   Usa una app de autenticación o una llave física. Si el raíz tiene *Access keys*, **bórralas**.
2. **No uses el usuario raíz para trabajar.** Usa un **usuario de IAM** con contraseña y **MFA**
   (por ejemplo, en un grupo `Admin` con la política `AdministratorAccess`). Con ese usuario entras a
   la consola y, en el punto 3, también a la terminal.
3. **Conecta la terminal con credenciales temporales** (no llaves permanentes) usando `aws login`.
   Requiere AWS CLI **2.32 o más nuevo** (`aws --version`). En PowerShell:
   ```powershell
   aws login --profile renbotia
   # Region: us-east-1 (si la pregunta)
   # Se abre el navegador: entras con tu usuario de IAM, contraseña y MFA (Authy) → apruebas
   ```
   Esto crea el **perfil** `renbotia` en `C:\Users\TU-USUARIO\.aws\config`. Un perfil es solo un
   nombre para un juego de credenciales; puedes tener varios (uno por cuenta o proyecto).

   Cada vez que trabajes:
   ```powershell
   $env:AWS_PROFILE = "renbotia"   # esta ventana de PowerShell usa ese perfil
   aws sts get-caller-identity     # debe mostrar tu cuenta y tu usuario, no "root"
   ```
   `$env:AWS_PROFILE` solo dura en **esa** ventana. Para no escribirlo cada vez, déjalo fijo para tu
   usuario de Windows (una sola vez; aplica desde la siguiente ventana que abras):
   ```powershell
   [Environment]::SetEnvironmentVariable("AWS_PROFILE", "renbotia", "User")
   ```
   Para quitarlo algún día: el mismo comando con `$null` en lugar de `"renbotia"`.

   Las credenciales se **renuevan solas cada 15 minutos** y la sesión dura **hasta 12 horas**. El
   perfil se queda guardado; lo que caduca son sus credenciales. Cuando caduca, la terminal te lo dice:
   vuelve a correr `aws login --profile renbotia`.

   Si después de entrar ves un error de permisos, el usuario necesita la política administrada
   `SignInLocalDevelopmentAccess` (un usuario con `AdministratorAccess` ya la cubre).

> **¿Y IAM Identity Center?** Es la otra forma de tener credenciales temporales, pensada para
> **varias cuentas y varias personas**. Para activarlo, AWS crea una **organización (AWS Organizations)**,
> y eso **convierte una cuenta de plan gratuito en plan de pago por uso y hace caducar los créditos
> gratuitos al instante**. Para una sola cuenta y una sola persona, `aws login` da el mismo beneficio
> sin ese costo. Identity Center tiene sentido el día que separes cuentas (producción / pruebas) o
> sumes equipo; entonces elige *Instancia de organización* en `us-east-1`.

### 2.1 Si tu terminal ya tenía acceso (usuario de IAM con llaves)

Si antes corriste `aws configure` con las *access keys* de un usuario de IAM (por ejemplo, en prácticas con
EC2), tu terminal ya entra a la cuenta. Compruébalo:

```powershell
aws sts get-caller-identity   # "Arn": "...:user/tu-usuario"  → usuario de IAM
aws configure list            # Type "shared-credentials-file" → llaves guardadas en C:\Users\TU-USUARIO\.aws\credentials
```

**Diferencia entre las dos formas de entrar desde la terminal:**

| | Llaves de acceso (`aws configure`) | `aws login` |
| --- | --- | --- |
| Qué guarda tu PC | Llaves que **nunca caducan** (`.aws\credentials`) | Credenciales **temporales**: se renuevan cada 15 min, la sesión dura hasta 12 h |
| Para usarlas | Nada: siempre están activas | `aws login`: navegador + contraseña + MFA (Authy) |
| Si alguien las copia | Entra indefinidamente, **sin MFA** | Le sirven solo minutos; no puede renovarlas sin tu contraseña y MFA |

Las dos usan el **mismo usuario de IAM** y entran a la **misma cuenta**; solo cambia cómo se demuestra
quién eres. El SSH a una instancia EC2 es otra cosa (un par de llaves `.pem` para entrar a esa
máquina); no tiene que ver con estas credenciales.

**Qué hacer:**
1. Crea el perfil con `aws login --profile renbotia` (punto 3) y compruébalo con
   `aws sts get-caller-identity --profile renbotia`.
2. **Desactiva** las llaves viejas: consola → *IAM* → *Users* → tu usuario → *Security credentials* →
   *Access keys* → **Deactivate**. (Desactivar se puede revertir; borrar no.)
3. Comprueba que el perfil nuevo sigue funcionando (`aws sts get-caller-identity --profile renbotia`).
   El perfil `default` dejará de funcionar (`InvalidClientTokenId`): es lo esperado, era el de las
   llaves. Si ves ese error en una ventana nueva, es que no tiene el perfil `renbotia` puesto (ver
   punto 3 del paso 2 para dejarlo fijo).
4. Si en unos días nada se rompe, **borra** las llaves en IAM y el archivo `.aws\credentials`.

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
aws sts get-caller-identity   # copia el número de "Account" (12 dígitos)
notepad terraform.tfvars      # pon ese número en aws_account_id y tu correo en budget_email; deja attach_domain = false
node ..\..\scripts\gen-edge-router.mjs   # genera edge-router.js (Terraform lo necesita)
terraform init
terraform validate
```

**¿Cómo sabe Terraform en qué cuenta construir?** Por las credenciales con las que lo corres: el perfil
`renbotia` del paso 2 (`$env:AWS_PROFILE = "renbotia"`). La región está fija en `versions.tf`
(`us-east-1`). Además, `aws_account_id` es un candado: si por error tuvieras activas las credenciales
de otra cuenta, Terraform se niega a trabajar en lugar de construir ahí.

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

Para aplicar **exactamente** lo que revisaste, guarda el plan en un archivo y aplica ese archivo:

```powershell
terraform plan -out frontend.tfplan    # mismo plan, guardado (el archivo no se sube a git)
terraform apply frontend.tfplan        # aplica ese plan tal cual; no vuelve a preguntar "yes"
```

(También funciona `terraform apply` a secas: vuelve a calcular el plan, te lo muestra y pide `yes`.
La diferencia es que lo que apruebas podría no ser idéntico a lo que revisaste antes.)

CloudFront tarda **5 a 15 minutos** en crearse; es normal. Al terminar:

```powershell
terraform output
```

Anota `cloudfront_domain` (algo como `d1abcd2efgh3.cloudfront.net`). La alerta de presupuesto llega
directo a tu correo; no hay que confirmar ninguna suscripción. Puedes verla en *Billing → Budgets*.

El certificado aparecerá como *Pending validation*: es normal, se valida en el paso 7. Mientras
`attach_domain = false`, Terraform no espera esa validación.

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

## 7. Mover el DNS a Route 53 y emitir el certificado

**Por qué:** CloudFront no tiene una IP fija, solo un nombre (`dxxxx.cloudfront.net`). El dominio
principal (`renbotia.com`, sin www) no puede ser CNAME, y el DNS de Squarespace no ofrece una forma
confiable de apuntarlo a un nombre. Route 53 sí: tiene registros **ALIAS** hacia CloudFront.

**Qué cambia y qué no:**
- El dominio sigue **comprado en Squarespace** (ahí se renueva). Solo cambia **quién responde** las
  consultas de DNS: los "servidores de nombres".
- Todos los registros actuales (correo de ImprovMX, correos del sistema con Resend, verificación de
  Google, `api` hacia Render y el sitio en Vercel) están **copiados tal cual** en `dns.tf`. Durante y
  después del cambio, el sitio **sigue en Vercel**: mover el tráfico es el paso 9.
- Costo: ~0.50 USD al mes por la zona. Las consultas a registros ALIAS de CloudFront no se cobran.
- Desde que termines este paso, **los registros se editan en `dns.tf`**, no en el panel de Squarespace
  (Squarespace deja de responder por tu dominio).

### 7.1 Crear la zona (todavía nadie la usa)

```powershell
terraform plan -out frontend.tfplan
terraform apply frontend.tfplan
terraform output name_servers     # 4 nombres tipo ns-123.awsdns-45.com
```

### 7.2 Comprobar que la zona es una copia fiel

```powershell
powershell -ExecutionPolicy Bypass -File .\comparar-dns.ps1
```

Pregunta lo mismo a Squarespace y a Route 53, registro por registro. Todo debe decir **OK**. Si algo
dice **DIFERENTE**, no sigas: corrige `dns.tf` → plan → apply → vuelve a comparar.

### 7.3 Apagar DNSSEC en Squarespace (y esperar)

DNSSEC es una firma que prueba que las respuestas de DNS son auténticas. La firma actual es de
Squarespace; si cambias de servidores con DNSSEC encendido, los resolutores verían respuestas de
Route 53 "sin la firma esperada" y **dejarían de resolver tu dominio** (sitio, API y correo).

1. Squarespace → `renbotia.com` → *DNS* → **DNSSEC** → desactivar.
2. Comprueba que el registro DS desapareció del registro de `.com`:
   ```powershell
   Resolve-DnsName renbotia.com -Type DS -Server 8.8.8.8 -DnsOnly
   ```
   Mientras aparezca una fila con tipo `DS`, todavía no. Cuando ya no aparezca, **espera 24 horas
   más** (los resolutores lo guardan en caché) antes del siguiente paso.

### 7.4 Cambiar los servidores de nombres

Squarespace → `renbotia.com` → *DNS* → **Servidores de nombres de dominio** → usar servidores
personalizados → pega los 4 de `terraform output name_servers` (sin el punto final) → guardar.

La propagación tarda de minutos a 48 horas. **No se rompe nada mientras tanto**: Squarespace y
Route 53 responden lo mismo (eso comprobaste en 7.2). Para ver el avance:

```powershell
Resolve-DnsName renbotia.com -Type NS -Server 8.8.8.8 -DnsOnly   # ya debe mostrar awsdns
```

Cuando ya aparezca `awsdns`, comprueba:
- [ ] Un correo enviado a tu dirección `@renbotia.com` llega (ImprovMX).
- [ ] Un correo del sistema llega (por ejemplo, "olvidé mi contraseña").
- [ ] `https://api.renbotia.com/api/health` responde y el panel funciona en Vercel como siempre.

### 7.5 El certificado se emite solo

Terraform ya creó en Route 53 los registros de validación. En cuanto el mundo vea la zona nueva,
AWS los encuentra: *Certificate Manager* (región **us-east-1**) → el certificado pasa a **Issued**
(minutos a 1 hora). Esos registros se quedan para siempre: AWS los usa para renovarlo cada año.

### 7.6 Asignar el dominio a CloudFront

```powershell
notepad terraform.tfvars      # attach_domain = true
terraform plan -out frontend.tfplan   # ~ cambia la distribución (aliases y certificado). Nada se borra.
terraform apply frontend.tfplan
```

Esto **todavía no mueve el tráfico**: el DNS sigue apuntando a Vercel (`site_target = "vercel"`).

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

Antes: el `VITE_GTM_ID` de Dinametra ya debe estar en las variables de GitHub y desplegado (si no,
el sitio en AWS sale sin medición). No lances ni modifiques campañas ese día.

1. Cambia una línea:
   ```powershell
   notepad terraform.tfvars      # site_target = "aws"
   terraform plan -out frontend.tfplan
   ```
   El plan debe mostrar: `~` el registro A de `renbotia.com` (de la IP de Vercel a un ALIAS de
   CloudFront), `+` un registro AAAA (IPv6) y `~` el CNAME de `www` (de Vercel a CloudFront).
   Nada más.
2. `terraform apply frontend.tfplan`
3. En 5 a 10 minutos (TTL de 5 min): `curl.exe -sI https://renbotia.com` debe mostrar `via: ... (CloudFront)`
   y `x-cache`, y `curl.exe -sI https://www.renbotia.com` un `301` hacia `https://renbotia.com/`.
4. Vuelve a hacer una ronda corta del checklist del paso 8, y revisa la medición: Tag Assistant (GTM)
   y el Administrador de eventos de Meta deben seguir recibiendo PageView y conversiones.

**Para regresar a Vercel** (si algo grave falla): `site_target = "vercel"` → `terraform plan -out frontend.tfplan`
→ `terraform apply frontend.tfplan`. En unos 5 minutos el tráfico vuelve a Vercel. Por eso **no borres
el proyecto de Vercel** todavía.

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
- **Tú (usuario de IAM con `aws login`)**: contraseña + MFA para entrar; la terminal recibe
  credenciales temporales (15 min, sesión de hasta 12 h). Nada de llaves permanentes en tu
  computadora (`.aws\credentials` debe quedar vacío o no existir).
- **GitHub Actions (rol `renbotia-frontend-deploy`)**: principio de **mínimo privilegio**:
  - Solo lo puede usar el repo `bananeadin-code/renbotia-client` desde la rama `main`
    (condición `sub` del OIDC). Un fork o una rama de pruebas no puede desplegar.
  - GitHub identifica al repo con su nombre **y su ID numérico inmutable**
    (`repo:bananeadin-code@246899438/renbotia-client@1336321738:ref:refs/heads/main`). Si alguien
    creara otro repo con el mismo nombre (por ejemplo, tras borrar este), su ID sería distinto y AWS lo rechazaría.
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
| `InvalidClientTokenId` en la terminal o en `terraform` | La ventana no tiene el perfil `renbotia` y usó las llaves viejas desactivadas. `$env:AWS_PROFILE = "renbotia"` (o déjalo fijo, paso 2). |
| La terminal dice que la sesión expiró o pide volver a entrar | Pasaron las 12 h de la sesión. `aws login --profile renbotia`. |
| `apply` falla a la mitad | Lo que alcanzó a crearse queda en el estado; no se pierde ni se duplica. Corrige el `.tf`, corre `terraform plan -out frontend.tfplan` (un plan **nuevo**: el anterior ya no sirve) y `terraform apply frontend.tfplan`. Solo crea lo que falta. |
| `Error: Saved plan is stale` | El estado cambió desde que guardaste el plan. Genera uno nuevo con `terraform plan -out frontend.tfplan`. |
| Error XML `AccessDenied` al abrir una página | El archivo no existe en S3 (¿falló la subida?) o la ruta no la conoce el enrutador. Corre de nuevo el workflow. |
| `CNAMEAlreadyExists` al hacer `apply` con `attach_domain = true` | Otra distribución de CloudFront (de cualquier cuenta) ya usa `renbotia.com`. Revisa *CloudFront → Distributions* en tu cuenta. |
| El certificado se queda en *Pending validation* | Los servidores de nombres todavía no apuntan a Route 53 (paso 7.4) o no ha terminado la propagación. Revisa con `Resolve-DnsName renbotia.com -Type NS -Server 8.8.8.8 -DnsOnly`. |
| El dominio deja de resolver (`SERVFAIL`) justo después de cambiar los servidores de nombres | DNSSEC seguía activo (paso 7.3). Regresa los servidores de nombres de Squarespace, apaga DNSSEC y espera antes de reintentar. |
| Un servicio nuevo pide agregar un registro DNS (verificación, correo…) | Agrégalo en `dns.tf` (`local.dns_records`) → plan → apply. Ya no en Squarespace. |
| GitHub: `Not authorized to perform sts:AssumeRoleWithWebIdentity` | La identidad que presentó GitHub no coincide con la que acepta el rol: otra rama, otro repo, o los IDs (`github_owner_id`, `github_repository_id`). Para ver **qué identidad mandó** GitHub: consola → *CloudTrail* → *Event history* → filtro *Event name* = `AssumeRoleWithWebIdentity` → abre el evento con error → `userIdentity.userName` (algo como `repo:usuario@123/repo@456:ref:refs/heads/main`). Compárala con la condición `sub` del rol (*IAM → Roles → renbotia-frontend-deploy → Trust relationships*). |
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
- **Perfil de AWS**: nombre para un juego de credenciales en `.aws\config` (aquí, `renbotia`). Se elige con `--profile` o `$env:AWS_PROFILE`.
- **`aws login`**: entra a la terminal con tu usuario de la consola (contraseña + MFA) y entrega credenciales temporales.
- **Identity Center (SSO)**: usuarios de trabajo para varias cuentas y personas; requiere AWS Organizations.
- **Estado de Terraform**: el registro de qué recursos administra Terraform y sus IDs.
