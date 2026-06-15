export default function PageTransition({ active }) {
  return (
    <div
      className={`page-transition${active ? ' page-transition--in' : ''}`}
      id="pageTransition"
      aria-hidden="true"
    />
  );
}
