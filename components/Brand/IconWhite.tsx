type Props = {
  className?: string;
};

export default function IconWhite({ className }: Props) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="M18 0h44a18 18 0 0 1 18 18v44a18 18 0 0 1-18 18H18A18 18 0 0 1 0 62V18A18 18 0 0 1 18 0m47.579 56.228a25 25 0 1 1 0-33.456l-5.946 5.353a17 17 0 1 0 0 22.75ZM7 47.5h13v13H7Z"
      />
    </svg>
  );
}
