/* Hallmark · component: button · genre: playful · theme: existing Little Birdee
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 */
"use client";

import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export type ProductButtonVariant = "primary" | "secondary" | "tertiary";
export type ProductButtonState = "loading" | "error" | "success";

type SharedProps = {
  children: ReactNode;
  description?: ReactNode;
  className?: string;
  variant?: ProductButtonVariant;
  size?: "default" | "compact" | "choice";
  state?: ProductButtonState;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  disabled?: boolean;
};

type NativeButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps | "className"> & {
    href?: never;
  };

type LinkButtonProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof SharedProps | "className" | "href"> & {
    href: string;
  };

export type ProductButtonProps = NativeButtonProps | LinkButtonProps;

function classNames(
  variant: ProductButtonVariant,
  size: "default" | "compact" | "choice",
  fullWidth: boolean,
  className?: string,
) {
  return [
    "product-button",
    `product-button--${variant}`,
    size === "compact" ? "product-button--compact" : "",
    size === "choice" ? "product-button--choice" : "",
    fullWidth ? "product-button--full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

function ButtonContent({
  children,
  description,
  leadingIcon,
  trailingIcon,
}: Pick<SharedProps, "children" | "description" | "leadingIcon" | "trailingIcon">) {
  return (
    <>
      {leadingIcon && (
        <span className="product-button__icon product-button__icon--leading" aria-hidden>
          {leadingIcon}
        </span>
      )}
      <span className="product-button__label">
        <span className="product-button__title">{children}</span>
        {description && <span className="product-button__description">{description}</span>}
      </span>
      {trailingIcon && (
        <span className="product-button__icon product-button__icon--trailing" aria-hidden>
          {trailingIcon}
        </span>
      )}
    </>
  );
}

export function ProductButton(props: ProductButtonProps) {
  const {
    variant = "secondary",
    size = "default",
    state,
    fullWidth = false,
    className,
    children,
    description,
    leadingIcon,
    trailingIcon,
    disabled = false,
  } = props;
  const isUnavailable = disabled || state === "loading";
  const classes = classNames(variant, size, fullWidth, className);
  const content = (
    <ButtonContent description={description} leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
      {children}
    </ButtonContent>
  );

  if ("href" in props && props.href) {
    const {
      href,
      target,
      rel,
      onClick,
      title,
      "aria-label": ariaLabel,
    } = props;

    if (isUnavailable) {
      return (
        <span
          className={classes}
          role="link"
          aria-disabled="true"
          aria-label={ariaLabel}
          data-state={state}
          title={title}
        >
          {content}
        </span>
      );
    }

    return (
      <Link
        href={href}
        className={classes}
        target={target}
        rel={rel}
        onClick={onClick}
        aria-label={ariaLabel}
        data-state={state}
        title={title}
      >
        {content}
      </Link>
    );
  }

  const nativeProps = props as NativeButtonProps;
  const {
    type = "button",
    onClick,
    name,
    value,
    form,
    id,
    title,
    "aria-label": ariaLabel,
    "aria-expanded": ariaExpanded,
    "aria-controls": ariaControls,
  } = nativeProps;

  return (
    <button
      type={type}
      className={classes}
      disabled={isUnavailable}
      onClick={onClick}
      name={name}
      value={value}
      form={form}
      id={id}
      title={title}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-busy={state === "loading" || undefined}
      data-state={state}
    >
      {content}
    </button>
  );
}
