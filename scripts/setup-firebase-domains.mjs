#!/usr/bin/env node

/**
 * Add authorized domains to Firebase project
 * Run this after authenticating with: firebase login
 */

import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function getAccessToken() {
  try {
    const { stdout } = await execAsync("gcloud auth application-default print-access-token");
    return stdout.trim();
  } catch (error) {
    console.error("❌ Error getting access token. Make sure to run: gcloud auth application-default login");
    process.exit(1);
  }
}

async function addAuthorizedDomains() {
  try {
    const token = await getAccessToken();
    const projectId = "launchforge-4ead9";
    const projectNumber = "747225145628";

    const domainsToAdd = [
      "zenith-psi-one.vercel.app",
      "zenith-4n2e27yjm-kimoosama18-ais-projects.vercel.app",
      "localhost:8080",
      "localhost",
    ];

    console.log("📋 Adding domains to Firebase project...");
    console.log("Domains to add:", domainsToAdd);

    // Get current config
    const getResponse = await axios.get(
      `https://identitytoolkit.googleapis.com/v2/projects/${projectId}/config`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const currentDomains = getResponse.data.authorizedDomains || [];
    console.log("\nCurrent domains:", currentDomains);

    const updatedDomains = [...new Set([...currentDomains, ...domainsToAdd])];

    if (JSON.stringify(currentDomains.sort()) === JSON.stringify(updatedDomains.sort())) {
      console.log("✅ All domains already authorized!");
      return;
    }

    // Update config
    const updateResponse = await axios.patch(
      `https://identitytoolkit.googleapis.com/v2/projects/${projectId}/config`,
      {
        authorizedDomains: updatedDomains,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("\n✅ Successfully updated authorized domains!");
    console.log("Updated domains:", updateResponse.data.authorizedDomains);
  } catch (error) {
    console.error("❌ Error:", error.response?.data?.error?.message || error.message);
    process.exit(1);
  }
}

addAuthorizedDomains();
