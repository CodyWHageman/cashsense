// src/utils/gravatarUtils.ts
import { MD5 } from 'crypto-js';

export const getGravatarUrl = (email: string | null | undefined): string => {
  if (!email) return '';
  
  const address = String(email).trim().toLowerCase();
  const hash = MD5(address).toString();
  
  // d=identicon ensures a generated geometric pattern if the user hasn't set up Gravatar yet
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
};