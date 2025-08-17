import '@/styles/globals.css';

// The custom App component enables us to import global CSS files.
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}