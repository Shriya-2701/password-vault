# Password Vault

A minimal, privacy-first password vault web app built with Next.js and Supabase.

This project was bootstrapped with [Next.js](https://nextjs.org) using [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Features

- Password generation with customizable options.
- AES encryption of passwords using CryptoJS.
- CRUD operations on stored passwords.
- Export and import encrypted vault data.
- Session management and auto logout for security.

## Getting Started

First, run the development server:

npm run dev

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying files in the `pages` directory. The page auto-updates as you edit the file.

API routes can be accessed in the `pages/api` directory.

## Technologies Used

- **Next.js** for React framework and SSR.
- **Supabase** for backend authentication and database.
- **CryptoJS** for client-side AES encryption.
- **React Toastify** for notifications.

## Build and Production

To create an optimized production build and start the server:

npm run build
npm start

## Environment Variables

Create a `.env.local` file in your project root and add these keys with your own Supabase credentials:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

## Live Demo

Try out the fully functional password vault app at:  
https://password-vault-liard.vercel.app/

## Crypto Note

Passwords are encrypted with **CryptoJS AES** before being saved or exported, ensuring data privacy by encrypting all sensitive information client-side.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.
- [Vercel Deployment](https://nextjs.org/docs/pages/building-your-application/deploying) - deploy your app with Vercel.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
