
function formatArgs(args) {
  return args
    .map(a => (a instanceof Error ? a.stack || a.message : typeof a === 'object' ? JSON.stringify(a) : a))
    .join(' ');
}

const logger = {
  info: (...args) => console.log('[INFO]', formatArgs(args)),
  warn: (...args) => console.warn('[WARN]', formatArgs(args)),
  error: (...args) => console.error('[ERROR]', formatArgs(args))
};

module.exports = { logger };
