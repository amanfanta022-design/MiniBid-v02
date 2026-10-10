import { useState, useEffect } from 'react';

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
  isUrgent: boolean;
  formatted: string;
}

export function calculateTimeRemaining(endTimeStr?: string | Date | null): TimeRemaining {
  if (!endTimeStr) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isExpired: true,
      isUrgent: false,
      formatted: '00d 00h 00m 00s',
    };
  }

  const end = new Date(endTimeStr).getTime();
  const now = Date.now();
  const diff = end - now;

  if (isNaN(end) || diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isExpired: true,
      isUrgent: false,
      formatted: '00d 00h 00m 00s',
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted = `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff,
    isExpired: false,
    isUrgent: diff < 30 * 60 * 1000,
    formatted,
  };
}

export function useAuctionTimer(endTimeStr?: string | Date | null): TimeRemaining {
  const [time, setTime] = useState<TimeRemaining>(() => calculateTimeRemaining(endTimeStr));

  useEffect(() => {
    setTime(calculateTimeRemaining(endTimeStr));
    const interval = setInterval(() => {
      setTime(calculateTimeRemaining(endTimeStr));
    }, 1000);
    return () => clearInterval(interval);
  }, [endTimeStr]);

  return time;
}
