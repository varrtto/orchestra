"use client";

import { Lineicons, type LineiconsProps } from "@lineiconshq/react-lineicons";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  Bell1Outlined,
  BoardWriting3Outlined,
  CalendarDaysOutlined,
  Comment1Outlined,
  Crown3Outlined,
  Envelope1Outlined,
  EnterOutlined,
  ExitOutlined,
  Gear1Outlined,
  Home2Outlined,
  Layers1Outlined,
  MenuHamburger1Outlined,
  Pencil1Outlined,
  PlusOutlined,
  Shield2Outlined,
  Trash3Outlined,
  User4Outlined,
  UserMultiple4Outlined,
  XmarkOutlined,
} from "@lineiconshq/free-icons";

type IconProps = Omit<LineiconsProps, "icon"> & {
  className?: string;
};

function Icon({
  icon,
  size = 18,
  color = "currentColor",
  className,
  ...props
}: IconProps & { icon: LineiconsProps["icon"] }) {
  return (
    <span
      className={className ? `inline-flex shrink-0 ${className}` : "inline-flex shrink-0"}
      aria-hidden={props["aria-label"] ? undefined : true}
    >
      <Lineicons icon={icon} size={size} color={color} {...props} />
    </span>
  );
}

export function ArrowLeftIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={ArrowLeftOutlined} {...props} />;
}

export function ArrowRightIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={ArrowRightOutlined} {...props} />;
}

export function BellIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Bell1Outlined} {...props} />;
}

export function BoardIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={BoardWriting3Outlined} {...props} />;
}

export function CalendarIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={CalendarDaysOutlined} {...props} />;
}

export function CommentIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Comment1Outlined} {...props} />;
}

export function CrownIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Crown3Outlined} {...props} />;
}

export function EnvelopeIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Envelope1Outlined} {...props} />;
}

export function EnterIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={EnterOutlined} {...props} />;
}

export function ExitIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={ExitOutlined} {...props} />;
}

export function GearIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Gear1Outlined} {...props} />;
}

export function HomeIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Home2Outlined} {...props} />;
}

export function MenuIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={MenuHamburger1Outlined} {...props} />;
}

export function LayersIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Layers1Outlined} {...props} />;
}

export function PencilIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Pencil1Outlined} {...props} />;
}

export function PlusIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={PlusOutlined} {...props} />;
}

export function ShieldIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Shield2Outlined} {...props} />;
}

export function TrashIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={Trash3Outlined} {...props} />;
}

export function UserIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={User4Outlined} {...props} />;
}

export function UsersIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={UserMultiple4Outlined} {...props} />;
}

export function XIcon(props: Omit<IconProps, "icon">) {
  return <Icon icon={XmarkOutlined} {...props} />;
}
