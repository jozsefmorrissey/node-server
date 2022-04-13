const apiKey = shell.exec('pst value mailgun apiKey').stdout.trim();
const domain = shell.exec('pst value mailgun domain').stdout.trim();

console.log(apiKey, domain)
