module.exports = function override(config, env) {
  if (env === 'production') {
    if (!config.optimization) config.optimization = {};
    config.optimization.minimize = true;
  }
  return config;
};
