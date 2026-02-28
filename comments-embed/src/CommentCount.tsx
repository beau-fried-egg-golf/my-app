interface CommentCountProps {
  count: number;
}

export default function CommentCount({ count }: CommentCountProps) {
  return <span className="fegc-comments-count-value">{count}</span>;
}
