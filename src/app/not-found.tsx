export default function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 - Not Found</h1>
      <p>The short URL you are looking for does not exist.</p>
      <a href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
        Create a new short URL
      </a>
    </div>
  );
}
