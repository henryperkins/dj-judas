import { useEffect, useRef, useState } from 'react';
import { metaSDK } from '../utils/metaSdk';

/**
 * Generic helper that loads the FB SDK (once) and parses
 * the XFBML inside the returned ref whenever `deps` change.
 */
export function useFacebookEmbed(
    selector: 'fb-page' | 'fb-video' | string,
    deps: unknown[] = []
) {
    const ref = useRef<HTMLDivElement>(null);
    const stillMounted = useRef(true);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        stillMounted.current = true;

        async function run() {
            try {
                await metaSDK.loadFacebookSDK();
                await new Promise((r) => setTimeout(r, 60)); // small paint delay
                if (stillMounted.current && ref.current) {
                    await metaSDK.parseFBML(ref.current);
                    setLoaded(true);
                }
            } catch (err) {
                if (stillMounted.current) {
                    setError('Failed to load Facebook content');
                    console.warn(`${selector} error (non-critical):`, err);
                }
            }
        }

        setLoaded(false);
        setError(null);
        run();

        return () => {
            stillMounted.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { ref, loaded, error };
}
