import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSettings } from '@/stores/settings';

/** Honours iOS "Reduce Motion" / Android "Remove animations". */
export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduce(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  const inApp = useSettings((s) => s.reduceMotion);
  return reduce || inApp;
}
