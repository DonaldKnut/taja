# MongoDB Atlas connection troubleshooting

## 0. "IP isn't whitelisted" (MongooseServerSelectionError)

If the error says **"you're trying to access the database from an IP that isn't whitelisted"**:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → your **project** → **Network Access** (left sidebar).
2. Click **Add IP Address**.
3. Either add your **current IP** (use "Add Current IP Address") or, for development only, allow all: **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Save and wait 1–2 minutes, then retry sign-in.

After whitelisting, if you still see connection errors, work through the steps below.

## 0b. Firewall allowed and IP whitelisted but still failing? → Use Standard URI

On Windows, even with Node allowed in the firewall and `0.0.0.0/0` in Atlas, the connection can fail because the app uses **`mongodb+srv://...`**, which does a **DNS SRV lookup**. That lookup is often blocked or broken on some networks (ISP, VPN, corporate). Use the **Standard** (non-SRV) connection string so the app never does SRV DNS:

1. **Get your Standard URI from Atlas**
   - Go to [Atlas](https://cloud.mongodb.com) → **Database** → click **Connect** on your cluster.
   - Choose **Drivers** (or "Connect your application").
   - If you see both **SRV** and **Standard** connection strings, copy the **Standard** one (starts with `mongodb://` and has a host like `tajaapp-shard-00-00.bsoayfk.mongodb.net:27017`).
   - If only SRV is shown: your host is in the error (e.g. `tajaapp-shard-00-00.bsoayfk.mongodb.net`). Build:  
     `mongodb://YOUR_USER:YOUR_PASSWORD@tajaapp-shard-00-00.bsoayfk.mongodb.net:27017/YOUR_DB_NAME?ssl=true&authSource=admin&retryWrites=true&w=majority`  
     Replace `YOUR_USER`, `YOUR_PASSWORD`, and `YOUR_DB_NAME` (often the default DB name from Atlas).
2. In **`.env.local`** add (or set):  
   `MONGODB_URI_STANDARD=mongodb://...`  
   (the full string from step 1, with real password).
3. **Restart the app** (`npm run dev`). The app uses `MONGODB_URI_STANDARD` when set and skips SRV DNS.

You can keep `MONGODB_URI` as-is; the app prefers `MONGODB_URI_STANDARD` when present.

---

If you see **"Could not connect to any servers"** or **"IP not whitelisted"** even after adding your IP (or `0.0.0.0/0`) in Atlas, the TCP connection from your machine to Atlas is usually being **blocked** before any MongoDB handshake.

## 1. querySrv ECONNREFUSED — use Standard URI (bypass DNS SRV)

If you see **`querySrv ECONNREFUSED _mongodb._tcp....mongodb.net`** (even with VPN off and 0.0.0.0/0 in Atlas), the failure is **DNS**: the SRV lookup for `mongodb+srv://` is refused. IP allowlist does **not** fix it. Use the **Standard** (non-SRV) connection string:

1. In [Atlas](https://cloud.mongodb.com): **Database** → **Connect** for the cluster (e.g. `tajaapp.bsoayfk.mongodb.net`).
2. Choose **Drivers** or **Connect using MongoDB Compass**. Look for a **Standard** / **direct** connection string (starts with `mongodb://` and has host:port). If only SRV is shown, use Compass to get the direct host list; build: `mongodb://USER:PASSWORD@host1:27017,host2:27017,host3:27017/tajaapp_db?ssl=true&replicaSet=...&authSource=admin&retryWrites=true&w=majority`.
3. Replace `<password>` with your DB user password.
4. In `.env.local` **add**: `MONGODB_URI_STANDARD=mongodb://openiyiibrahim_db_user:YOUR_PASSWORD@host1:27017,...` (use exact hostnames and `replicaSet` from Atlas).
5. Restart the app (`npm run dev`). The app uses `MONGODB_URI_STANDARD` when set and skips the SRV lookup.

## 2. Confirm it's a local block: test with MongoDB Compass

1. Install [MongoDB Compass](https://www.mongodb.com/products/compass) (free).
2. Copy your `MONGODB_URI` from `.env.local` (same value the app uses).
3. In Compass, **New connection** → paste the URI → **Connect**.

- **If Compass connects**  
  Atlas and your IP are fine. The block is specific to **Node / your app** (e.g. firewall or antivirus allowing Compass but not Node).

- **If Compass also fails**  
  Something between your PC and Atlas is blocking outbound MongoDB (firewall, antivirus, or ISP). Fix that first, then retry the app.

## 3. Allow Node.js through Windows Firewall

Atlas uses **outbound** TCP ports **27015–27017**. Your firewall or antivirus may be allowing Compass/browser but blocking the Node process.

1. Open **Windows Defender Firewall** → **Advanced settings**.
2. **Outbound Rules** → **New Rule**.
3. **Program** → **This program path** → point to your **Node.js executable**  
   (e.g. `C:\Program Files\nodejs\node.exe` or the path from `where node`).
4. Allow **TCP**, then finish the wizard.

Alternatively, when you run `npm run dev`, if Windows prompts "Allow access?", choose **Allow**.

## 4. Antivirus / "Network protection"

Temporarily disable "Network protection" or "Firewall" in your antivirus and try again. If the app then connects, add an exception for Node (or the folder where you run `npm run dev`) instead of leaving it off.

## 5. Use the exact URI from Atlas

1. In [Atlas](https://cloud.mongodb.com): **Database** → **Connect** for the cluster that has `tajaapp.bsoayfk.mongodb.net`.
2. **Drivers** (or "Connect your application") → copy the **standard** connection string (not SRV if you had SRV issues).
3. Replace `<password>` with your DB user password.
4. Put that string in `.env.local` as `MONGODB_URI` (or `MONGODB_URI_STANDARD`), restart the app, and try again.

## 6. Same project and cluster

- **Network Access** is **per project**. Ensure you added the IP (or `0.0.0.0/0`) in the **same project** that contains the cluster `tajaapp.bsoayfk.mongodb.net`.
- If the cluster is **paused** (e.g. free tier), **Database** → cluster → **Resume**, then wait until it's running.

---

**Quick check:** Run from your project folder:

```bash
npx tsx src/scripts/test-mongo-connection.ts
```

If it prints the same "Could not connect…" error, the issue is network/firewall/Atlas, not the OAuth flow.
