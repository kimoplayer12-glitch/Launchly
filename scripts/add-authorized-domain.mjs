import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";
import { join } from "path";

const keyPath = join(process.cwd(), ".env.json");

try {
  const serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));

  initializeApp({
    credential: cert(serviceAccount),
  });

  const auth = getAuth();

  // Get current auth config and add domain
  auth.getProjectConfig()
    .then((config) => {
      console.log("Current authorized domains:", config.authorizedDomains);
      
      const domainsToAdd = [
        "zenith-psi-one.vercel.app",
        "zenith-4n2e27yjm-kimoosama18-ais-projects.vercel.app",
        "localhost:8080",
        "localhost",
      ];

      const currentDomains = config.authorizedDomains || [];
      const newDomains = [...new Set([...currentDomains, ...domainsToAdd])];

      if (JSON.stringify(currentDomains.sort()) !== JSON.stringify(newDomains.sort())) {
        return auth.updateProjectConfig({
          authorizedDomains: newDomains,
        });
      }
      console.log("Domains already up to date");
      return null;
    })
    .then((result) => {
      if (result) {
        console.log("✅ Successfully added authorized domains");
        console.log("Updated domains:", result.authorizedDomains);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error updating authorized domains:", error.message);
      process.exit(1);
    });
} catch (error) {
  console.error("❌ Error loading service account:", error.message);
  console.log("Make sure you have .env.json file with Firebase service account key");
  process.exit(1);
}
