import { logger } from "@vagabond/shared-utils";
import { useEffect, useState } from "react";

import { CardWithEmoji } from "./CardWithEmoji";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  labels: {
    eventTitle: string;
    daysLabel: string;
    hoursLabel: string;
    minutesLabel: string;
    secondsLabel: string;
    emailPrompt: string;
    buttonText: string;
    successMessage: string;
    errorMessage: string;
    placeHolderText: string;
  };
}

const targetDate = new Date("2026-03-06T00:00:00");

export default function CountdownTimer({ labels }: CountdownTimerProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setIsSubmitting(true);

    void (async (): Promise<void> => {
      try {
        const response = await fetch("/api/save-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        setEmail("");
        alert(labels.successMessage);
      } catch (error) {
        logger.error(error);
        alert(labels.errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateTimer = (): void => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    // Mettre à jour toutes les secondes
    const timer = setInterval(updateTimer, 1000);
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-initialize-state -- it's temporary
    updateTimer(); // Pour éviter un délai initial

    return (): void => {
      clearInterval(timer);
    };
  }, []);

  return (
    <CardWithEmoji emoji={"🚀"}>
      <div className="mb-2 flex items-center justify-between md:mb-4">
        <h3 className="w-full text-center text-lg font-bold md:text-xl">
          {labels.eventTitle}
        </h3>
      </div>
      {/* Chronomètre */}
      <div className="mb-1 flex justify-center text-center md:mb-2">
        <div className="mx-1 md:mx-2">
          <div className="flex text-2xl font-bold md:text-4xl">
            <div className="mr-0.5 flex h-10 w-9 items-center justify-center rounded-md bg-gray-200 md:mr-1 md:h-14 md:w-12">
              {String(timeLeft.days).padStart(2, "0")}
            </div>
          </div>
          <div className="mt-0.5 text-xs md:mt-1 md:text-sm">
            {labels.daysLabel}
          </div>
        </div>

        <div className="mx-0.5 flex items-start pt-1 text-2xl font-bold md:mx-1 md:pt-2 md:text-4xl">
          :
        </div>

        <div className="mx-1 md:mx-2">
          <div className="flex text-2xl font-bold md:text-4xl">
            <div className="mr-0.5 flex h-10 w-9 items-center justify-center rounded-md bg-gray-200 md:mr-1 md:h-14 md:w-12">
              {String(timeLeft.hours).padStart(2, "0")}
            </div>
          </div>
          <div className="mt-0.5 text-xs md:mt-1 md:text-sm">
            {labels.hoursLabel}
          </div>
        </div>

        <div className="mx-0.5 flex items-start pt-1 text-2xl font-bold md:mx-1 md:pt-2 md:text-4xl">
          :
        </div>

        <div className="mx-1 md:mx-2">
          <div className="flex text-2xl font-bold md:text-4xl">
            <div className="mr-0.5 flex h-10 w-9 items-center justify-center rounded-md bg-gray-200 md:mr-1 md:h-14 md:w-12">
              {String(timeLeft.minutes).padStart(2, "0")}
            </div>
          </div>
          <div className="mt-0.5 text-xs md:mt-1 md:text-sm">
            {labels.minutesLabel}
          </div>
        </div>

        <div className="mx-0.5 flex items-start pt-1 text-2xl font-bold md:mx-1 md:pt-2 md:text-4xl">
          :
        </div>

        <div className="mx-1 md:mx-2">
          <div className="flex text-2xl font-bold md:text-4xl">
            <div className="mr-0.5 flex h-10 w-9 items-center justify-center rounded-md bg-gray-200 md:mr-1 md:h-14 md:w-12">
              {String(timeLeft.seconds).padStart(2, "0")}
            </div>
          </div>
          <div className="mt-0.5 text-xs md:mt-1 md:text-sm">
            {labels.secondsLabel}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-2 md:gap-4 md:py-4">
        <p className="text-center text-2xl md:text-4xl">{"📩"}</p>
        <p className="text-center text-sm font-medium text-gray-800 md:text-base">
          {labels.emailPrompt}
        </p>
        <p className="text-center text-2xl md:text-4xl">{"📩"}</p>
      </div>

      <form
        onSubmit={handleEmailSubmit}
        className="flex flex-col items-center pt-2 md:pt-4"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          placeholder={labels.placeHolderText}
          className="mb-2 w-full rounded-md border border-gray-300 bg-white p-2.5 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary md:mb-4 md:p-3"
          required
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-primary px-6 py-3 font-bold text-white shadow-md transition-all hover:bg-primary-700 hover:shadow-lg disabled:opacity-50"
        >
          {labels.buttonText}
        </button>
      </form>
    </CardWithEmoji>
  );
}
