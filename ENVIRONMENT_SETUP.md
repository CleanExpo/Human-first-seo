# Environment Variables Setup Guide

## 🔐 API Keys Configuration

This guide will help you set up the required API keys for the Human-First SEO application.

## 📁 Files Overview

- **`.env.example`** - Template with all required variables (committed to Git)
- **`.env.local`** - Your actual API keys (ignored by Git for security)
- **`ENVIRONMENT_SETUP.md`** - This setup guide

## 🚀 Quick Setup

### 1. Local Development Setup

The `.env.local` file has been created for you with placeholder values. Follow these steps:

1. **Open the `.env.local` file** in your project root
2. **Replace the placeholder values** with your actual API keys
3. **Save the file**
4. **Restart your development server**: `npm run dev`

### 2. Required API Keys

#### 🤖 OpenAI (Required)
- **Purpose**: Content analysis, SEO optimization
- **Get API Key**: https://platform.openai.com/api-keys
- **Variable**: `OPENAI_API_KEY=sk-proj-...`

#### 🧠 Anthropic Claude (Required)
- **Purpose**: Readability scoring, content quality analysis
- **Get API Key**: https://console.anthropic.com/
- **Variable**: `ANTHROPIC_API_KEY=sk-ant-api03-...`

#### 🔍 Google AI (Required)
- **Purpose**: SEO insights, competitor analysis
- **Get API Key**: https://aistudio.google.com/app/apikey
- **Variable**: `GOOGLE_AI_API_KEY=AIza...`

#### 🌐 Perplexity (Optional)
- **Purpose**: Research-backed content analysis
- **Get API Key**: https://www.perplexity.ai/settings/api
- **Variable**: `PERPLEXITY_API_KEY=pplx-...`

## 🔧 Production Deployment (Vercel)

### Setting Environment Variables in Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/admin-cleanexpo247s-projects/human-first-seo
2. **Navigate to**: Settings → Environment Variables
3. **Add each variable**:
   ```
   OPENAI_API_KEY = sk-proj-your-actual-key
   ANTHROPIC_API_KEY = sk-ant-your-actual-key
   GOOGLE_AI_API_KEY = AIyour-actual-key
   PERPLEXITY_API_KEY = pplx-your-actual-key (optional)
   ```
4. **Set Environment**: Production, Preview, Development (or as needed)
5. **Redeploy** your application

## 🧪 Testing Your Setup

### 1. Local Testing
```bash
# Start development server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/content/analyze
curl http://localhost:3000/api/competitor/analyze
```

### 2. Production Testing
```bash
# Test live endpoints
curl https://human-first-avasa98up-admin-cleanexpo247s-projects.vercel.app/api/content/analyze
curl https://human-first-avasa98up-admin-cleanexpo247s-projects.vercel.app/api/competitor/analyze
```

## 🔒 Security Best Practices

### ✅ Do's
- ✅ Keep API keys in `.env.local` for local development
- ✅ Use Vercel environment variables for production
- ✅ Regularly rotate your API keys
- ✅ Monitor API usage and costs

### ❌ Don'ts
- ❌ Never commit API keys to Git
- ❌ Don't share API keys in chat/email
- ❌ Don't use production keys in development
- ❌ Don't expose keys in client-side code

## 🚨 Troubleshooting

### Common Issues

#### 1. "API Key not found" errors
- **Check**: Ensure `.env.local` exists and has correct variable names
- **Solution**: Restart development server after adding keys

#### 2. "Unauthorized" errors
- **Check**: Verify API keys are valid and active
- **Solution**: Regenerate keys from provider dashboards

#### 3. "Rate limit exceeded"
- **Check**: Monitor API usage in provider dashboards
- **Solution**: Implement rate limiting or upgrade plans

#### 4. Production deployment issues
- **Check**: Verify environment variables are set in Vercel
- **Solution**: Redeploy after adding missing variables

## 📊 API Usage Monitoring

### OpenAI
- **Dashboard**: https://platform.openai.com/usage
- **Billing**: https://platform.openai.com/account/billing

### Anthropic
- **Dashboard**: https://console.anthropic.com/
- **Usage**: Check usage in console

### Google AI
- **Console**: https://console.cloud.google.com/
- **Quotas**: Monitor API quotas and usage

## 🆘 Support

If you encounter issues:

1. **Check the logs**: `npm run dev` for local, Vercel dashboard for production
2. **Verify API keys**: Test keys directly with provider APIs
3. **Review documentation**: Each provider has detailed API docs
4. **Check rate limits**: Ensure you haven't exceeded usage limits

## 🎯 Next Steps

After setting up environment variables:

1. **Test all features** in local development
2. **Deploy to production** with environment variables
3. **Monitor API usage** and costs
4. **Set up alerts** for usage thresholds
5. **Plan for scaling** as usage grows

---

**🔐 Remember: Never commit actual API keys to version control!**
