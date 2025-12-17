# 📱 Access NoteMitra from Your Phone

## ✅ Setup Complete!

Your NoteMitra platform is now accessible from your phone and other devices on the same WiFi network.

---

## 🌐 Access URLs

### From Your Computer (Localhost):
- Website: **http://localhost:3000**
- API: **http://localhost:5000/api**

### From Your Phone (Same WiFi):
- Website: **http://192.168.245.192:3000**
- API: **http://192.168.245.192:5000/api**

---

## 📋 Step-by-Step: Access from Phone

### Step 1: Connect to Same WiFi
1. Make sure your phone is connected to the **SAME WiFi network** as your computer
2. Both devices must be on the same network (e.g., your home WiFi)

### Step 2: Allow Through Firewall (Important!)
Windows Firewall might block connections. Run these commands in PowerShell **as Administrator**:

```powershell
# Allow Node.js through Windows Firewall
New-NetFirewallRule -DisplayName "NoteMitra Backend" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName "NoteMitra Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

**OR** manually:
1. Open **Windows Defender Firewall with Advanced Security**
2. Click **Inbound Rules** → **New Rule**
3. Rule Type: **Port**
4. Protocol: **TCP**, Specific local ports: **3000, 5000**
5. Action: **Allow the connection**
6. Profile: Check all (Domain, Private, Public)
7. Name: **NoteMitra**
8. Click **Finish**

### Step 3: Open Website on Phone
1. Open any browser on your phone (Chrome, Safari, etc.)
2. Type in the address bar: **http://192.168.245.192:3000**
3. Press Enter/Go

You should see the NoteMitra homepage! 🎉

---

## 🔧 Troubleshooting

### "Can't reach this page" or "Connection refused"

**Solution 1: Check Firewall**
- Make sure ports 3000 and 5000 are allowed in Windows Firewall (see Step 2 above)

**Solution 2: Verify Same Network**
```bash
# On your phone, check WiFi name
# On your computer, check WiFi name
# They MUST match exactly
```

**Solution 3: Verify Servers are Running**
- Backend should show: ✅ NOTEMITRA BACKEND SERVER RUNNING on port 5000
- Frontend should show: ✓ Ready in 3.2s

**Solution 4: Check IP Address**
Your computer's IP might change. To check current IP:
```powershell
ipconfig | findstr "IPv4"
```
Look for the one starting with `192.168.*` or `10.*`

### "Failed to Login" Issue

**Important**: The server uses **in-memory storage** which clears on restart.

**Solution**:
1. **Create a new account** after every server restart
2. Use the admin emails to get admin access:
   - `pavanmanepalli521@gmail.com` / `Vedesh@0507`
   - `mohangupta16@gmail.com` / `Mohan@16`

**Permanent Fix**: Setup MongoDB Atlas (see PRODUCTION_SETUP_GUIDE.md)

---

## 📱 QR Code Access (Optional)

You can create a QR code for easy access:

1. Go to: https://www.qr-code-generator.com/
2. Select: **URL**
3. Enter: **http://192.168.245.192:3000**
4. Download QR code
5. Scan with your phone camera

---

## 🔒 Security Notes

### Current Setup (Development):
- ✅ Works on local WiFi network
- ✅ Access from any device on same WiFi
- ⚠️ Not accessible from internet (safe)
- ⚠️ Data clears on server restart (in-memory)

### For Production (Internet Access):
You would need:
1. **MongoDB Atlas** - Permanent data storage
2. **AWS S3** - Real file uploads
3. **Domain Name** - Instead of IP address
4. **HTTPS/SSL** - Secure connection
5. **Cloud Hosting** - Vercel, AWS, etc.

See **PRODUCTION_SETUP_GUIDE.md** for details.

---

## 🎯 Quick Checklist

- [ ] Both servers running (backend on 5000, frontend on 3000)
- [ ] Phone connected to same WiFi as computer
- [ ] Firewall allows ports 3000 and 5000
- [ ] Accessed URL: http://192.168.245.192:3000
- [ ] Can see NoteMitra homepage
- [ ] Created new account (data was cleared on restart)
- [ ] Can browse, upload, and download notes

---

## 💡 Pro Tips

### Share with Friends
Anyone on your WiFi can access using: **http://192.168.245.192:3000**

### Keep Servers Running
- Don't close VS Code terminals
- Don't close the PowerShell windows
- Keep your computer awake

### Admin Access from Phone
1. Create account with admin email on phone
2. Sign in
3. Access admin panel from navbar

---

## 🚀 Current Status

✅ **Backend Server**: Running on 0.0.0.0:5000 (accessible from network)  
✅ **Frontend Server**: Running on 0.0.0.0:3000 (accessible from network)  
✅ **CORS**: Configured to allow phone access  
✅ **Auto IP Detection**: Frontend automatically uses correct API URL  

**From Computer**: http://localhost:3000  
**From Phone**: http://192.168.245.192:3000  

---

## ❓ Need Help?

1. **Check server logs** in VS Code terminals
2. **Verify firewall** is allowing connections
3. **Confirm same WiFi** network
4. **Try different browser** on phone
5. **Restart servers** if needed
6. **Check IP hasn't changed**: Run `ipconfig` again

---

## 🎉 Enjoy!

You can now:
- Access NoteMitra from your phone
- Share with friends on same WiFi
- Test on multiple devices
- Demo your project anywhere with WiFi

Happy coding! 📱✨
