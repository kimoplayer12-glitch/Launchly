import { RequestHandler } from "express";
import crypto from "crypto";

interface SchedulePostRequest {
  userId: string;
  platforms: ("instagram" | "twitter" | "tiktok" | "youtube")[];
  caption: string;
  mediaUrl?: string;
  mediaType: "image" | "video";
  scheduledFor: string;
  creditsCost: number;
}

// Encryption helpers for tokens
function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY || 'dev-key-32-chars-minimum-required'),
    iv
  );
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(encrypted: string): string {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY || 'dev-key-32-chars-minimum-required'),
    iv
  );
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export const handleSchedulePost: RequestHandler = async (req, res) => {
  const { userId, platforms, caption, mediaUrl, mediaType, scheduledFor, creditsCost } =
    req.body as SchedulePostRequest;

  if (!userId || !platforms || !caption || !scheduledFor) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const posts = platforms.map((platform) => ({
      id: `post_${Date.now()}_${platform}`,
      platform,
      userId,
      caption,
      mediaUrl,
      mediaType,
      scheduledFor: new Date(scheduledFor),
      status: "scheduled",
      creditsCost,
      createdAt: new Date(),
    }));

    console.log("Posts scheduled:", { userId, platforms, count: posts.length });

    res.json({
      success: true,
      message: `${posts.length} post(s) scheduled successfully`,
      posts,
    });
  } catch (error) {
    console.error("Error scheduling posts:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to schedule posts",
    });
  }
};

export const handleGetScheduledPosts: RequestHandler = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  try {
    const posts: any[] = [];
    console.log("Fetching scheduled posts for user:", userId);

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch scheduled posts",
    });
  }
};

export const handleConnectSocialAccount: RequestHandler = async (req, res) => {
  const { userId, platform, accessToken, refreshToken, username } = req.body;

  if (!userId || !platform || !accessToken || !username) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const account = {
      id: `${platform}_${userId}`,
      userId,
      platform,
      username,
      accessToken: "[ENCRYPTED]",
      refreshToken: refreshToken ? "[ENCRYPTED]" : null,
      connectedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    console.log("Social account connected:", { platform, username });

    res.json({
      success: true,
      message: `${platform} account connected successfully`,
      account,
    });
  } catch (error) {
    console.error("Error connecting social account:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to connect account",
    });
  }
};

export const handleGetOAuthUrl: RequestHandler = async (req, res) => {
  const { platform, userId } = req.query;

  if (!platform || !userId) {
    res.status(400).json({ error: "platform and userId are required" });
    return;
  }

  try {
    // Store state in session/database for security
    const state = crypto.randomBytes(16).toString('hex');
    
    // You should store this state temporarily (5 min expiry) to verify in callback
    // For now, we'll send it back to frontend to include in redirect
    
    const redirectUri = process.env.OAUTH_REDIRECT_URI || 'http://localhost:8081/api/social/oauth/callback';
    
    const oauthUrls: Record<string, string> = {
      instagram: `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code&state=${state}`,
      twitter: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${redirectUri}&scope=tweet.write%20tweet.read%20users.read&state=${state}`,
      tiktok: `https://open-api.tiktok.com/oauth/authorize?client_key=${process.env.TIKTOK_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=video.upload&state=${state}`,
      youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.YOUTUBE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/youtube&state=${state}`,
    };

    const url = oauthUrls[platform as string];

    if (!url) {
      res.status(400).json({ error: "Invalid platform" });
      return;
    }

    res.json({
      success: true,
      url,
      state,
    });
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate OAuth URL",
    });
  }
};

// OAuth Callback Handler
export const handleOAuthCallback: RequestHandler = async (req, res) => {
  const { platform, code, state } = req.query;
  const userId = req.query.user_id as string;

  if (!platform || !code) {
    return res.status(400).json({ error: "Missing platform or code" });
  }

  try {
    let tokenData: any;
    let userInfo: any;

    // Exchange code for access token based on platform
    if (platform === 'instagram') {
      tokenData = await exchangeInstagramToken(code as string);
      userInfo = await getInstagramUserInfo(tokenData.access_token);
    } else if (platform === 'twitter') {
      tokenData = await exchangeTwitterToken(code as string);
      userInfo = await getTwitterUserInfo(tokenData.access_token);
    } else if (platform === 'tiktok') {
      tokenData = await exchangeTikTokToken(code as string);
      userInfo = await getTikTokUserInfo(tokenData.access_token);
    } else if (platform === 'youtube') {
      tokenData = await exchangeYouTubeToken(code as string);
      userInfo = await getYouTubeUserInfo(tokenData.access_token);
    } else {
      return res.status(400).json({ error: "Invalid platform" });
    }

    // Note: Firebase save is handled by frontend after redirect
    // Backend just exchanges the code and returns success
    // Frontend will save the token to Firebase using the client SDK

    // Redirect back to frontend with success
    const redirectUrl = new URL('http://localhost:8081/social-media-scheduler');
    redirectUrl.searchParams.set('connected', platform as string);
    redirectUrl.searchParams.set('username', userInfo.username);
    redirectUrl.searchParams.set('token', tokenData.access_token);
    if (tokenData.refresh_token) {
      redirectUrl.searchParams.set('refreshToken', tokenData.refresh_token);
    }
    if (tokenData.expires_in) {
      redirectUrl.searchParams.set('expiresIn', tokenData.expires_in.toString());
    }
    
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect(`http://localhost:8081/social-media-scheduler?error=${encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')}`);
  }
};

// Platform-specific token exchange functions
async function exchangeInstagramToken(code: string): Promise<any> {
  const response = await fetch('https://graph.instagram.com/v18.0/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID || '',
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.OAUTH_REDIRECT_URI || '',
    }).toString(),
  });
  return response.json();
}

async function getInstagramUserInfo(accessToken: string): Promise<any> {
  const response = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
  const data = await response.json();
  return {
    id: data.id,
    username: data.username,
  };
}

async function exchangeTwitterToken(code: string): Promise<any> {
  const response = await fetch('https://oauth2.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.OAUTH_REDIRECT_URI || '',
      client_id: process.env.TWITTER_CLIENT_ID || '',
      client_secret: process.env.TWITTER_CLIENT_SECRET || '',
      code_verifier: process.env.TWITTER_CODE_VERIFIER || '',
    }).toString(),
  });
  return response.json();
}

async function getTwitterUserInfo(accessToken: string): Promise<any> {
  const response = await fetch('https://api.twitter.com/2/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  return {
    id: data.data.id,
    username: data.data.username,
  };
}

async function exchangeTikTokToken(code: string): Promise<any> {
  const response = await fetch('https://open-api.tiktok.com/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_ID || '',
      client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
    }).toString(),
  });
  const data = await response.json();
  return data.data;
}

async function getTikTokUserInfo(accessToken: string): Promise<any> {
  const response = await fetch('https://open-api.tiktok.com/v1/user/info/', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  return {
    id: data.data.user.open_id,
    username: data.data.user.display_name,
  };
}

async function exchangeYouTubeToken(code: string): Promise<any> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID || '',
      client_secret: process.env.YOUTUBE_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000'}/callback`,
    }).toString(),
  });
  const data = await response.json();
  return data;
}

async function getYouTubeUserInfo(accessToken: string): Promise<any> {
  const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  const channel = data.items[0];
  return {
    id: channel.id,
    username: channel.snippet.title,
  };
}

