export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: `window.location.replace('/es')` }} />
      </body>
    </html>
  );
}
