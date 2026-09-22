"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  ArrowLeftIcon,
  LayersIcon,
  MenuIcon,
  UserIcon,
} from "@/components/ui/icon";
import { useT } from "@/components/providers/locale-provider";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type AppHeaderNavItem = {
  href: string;
  labelKey: "nav.profile" | "nav.boards";
  icon: React.ReactNode;
};

const profileNavItem: AppHeaderNavItem = {
  href: "/profile",
  labelKey: "nav.profile",
  icon: <UserIcon size={18} />,
};

const boardsNavItem: AppHeaderNavItem = {
  href: "/boards",
  labelKey: "nav.boards",
  icon: <LayersIcon size={18} />,
};

type AppHeaderProps = {
  title?: string;
  backHref?: string;
  /** Nav link beside Sign out. Defaults to Profile. */
  navItem?: AppHeaderNavItem;
};

function NavLink({
  href,
  children,
  icon,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-base text-slate-600 transition hover:bg-slate-100 hover:text-teal-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-300"
      }
    >
      {icon}
      {children}
    </Link>
  );
}

function BackButton({ href }: { href: string }) {
  const t = useT();
  return (
    <Link
      href={href}
      aria-label={t("nav.backToBoards")}
      className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:bg-teal-950 dark:hover:text-teal-300"
    >
      <ArrowLeftIcon size={20} />
    </Link>
  );
}

function MobileMenu({
  open,
  onClose,
  navItem,
}: {
  open: boolean;
  onClose: () => void;
  navItem: AppHeaderNavItem;
}) {
  const t = useT();
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label={t("nav.closeMenu")}
        className="fixed inset-0 top-14 z-[90] bg-black/40 md:hidden"
        onClick={onClose}
      />
      <div
        role="menu"
        className="fixed left-0 right-0 top-14 z-[95] w-full border-b border-slate-200 bg-white py-2 shadow-lg md:hidden dark:border-slate-700 dark:bg-slate-900"
      >
        <NavLink
          href={navItem.href}
          icon={navItem.icon}
          onClick={onClose}
          className="flex w-full items-center gap-3 px-4 py-3 text-base text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t(navItem.labelKey)}
        </NavLink>
        <div className="border-t border-slate-100 dark:border-slate-800">
          <SignOutButton
            onSignedOut={onClose}
            className="inline-flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-base text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          />
        </div>
      </div>
    </>,
    document.body,
  );
}

function HeaderUserNav({ navItem }: { navItem: AppHeaderNavItem }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      <div className="hidden items-center gap-2 md:flex">
        <ThemeToggle />
        <NavLink href={navItem.href} icon={navItem.icon}>
          {t(navItem.labelKey)}
        </NavLink>
        <SignOutButton />
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <ThemeToggle />
        <button
          type="button"
          aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
          className="relative z-[96] inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:bg-teal-950 dark:hover:text-teal-300"
        >
          <MenuIcon size={20} />
        </button>

        <MobileMenu open={open} onClose={closeMenu} navItem={navItem} />
      </div>
    </>
  );
}

export function AppHeader({
  title,
  backHref,
  navItem = profileNavItem,
}: AppHeaderProps) {
  if (backHref) {
    return (
      <header className="sticky top-0 z-50 grid h-14 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-teal-950/10 bg-header px-3 backdrop-blur sm:grid-cols-[1fr_auto_1fr] sm:gap-0 sm:px-4 dark:border-white/10">
        <div className="flex items-center">
          <BackButton href={backHref} />
        </div>
        {title ? (
          <h1 className="min-w-0 truncate px-1 text-center text-lg font-semibold text-slate-800 sm:max-w-[min(100vw-12rem,36rem)] sm:px-4 dark:text-slate-100">
            {title}
          </h1>
        ) : (
          <div />
        )}
        <div className="flex items-center justify-end">
          <HeaderUserNav navItem={navItem} />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-teal-950/10 bg-header px-3 backdrop-blur sm:px-4 dark:border-white/10">
      <Link
        href="/boards"
        className="inline-flex shrink-0 items-center gap-2 font-display text-xl text-teal-950 dark:text-teal-50"
      >
        <Image src="/icon.png" alt="Orchest" width={40} height={40} />
        Orchest
      </Link>
      <HeaderUserNav navItem={navItem} />
    </header>
  );
}

export { boardsNavItem, profileNavItem };
