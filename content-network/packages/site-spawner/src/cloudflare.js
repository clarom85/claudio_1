/**
 * Cloudflare Pages API client
 * Crea progetti e deploya siti statici via API
 */

const CF_API = 'https://api.cloudflare.com/client/v4';

function headers() {
  return {
    'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json'
  };
}

export async function createPagesProject(projectName, domain) {
  const res = await fetch(
    `${CF_API}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: projectName,
        production_branch: 'main',
        build_config: {
          build_command: 'npm run build',
          destination_dir: 'dist',
          root_dir: ''
        }
      })
    }
  );

  const data = await res.json();
  if (!data.success) throw new Error(`CF project creation failed: ${JSON.stringify(data.errors)}`);
  return data.result;
}

export async function uploadDeploy(projectName, buildDir) {
  // Cloudflare Pages Direct Upload (multipart form)
  const FormData = (await import('formdata-node')).FormData;
  const { Blob } = await import('node:buffer');
  const { readdirSync, readFileSync, statSync } = await import('fs');
  const { join, relative } = await import('path');

  const formData = new FormData();

  function addFiles(dir, baseDir) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        addFiles(fullPath, baseDir);
      } else {
        const relativePath = relative(baseDir, fullPath);
        const content = readFileSync(fullPath);
        formData.append('files', new Blob([content]), relativePath);
      }
    }
  }

  addFiles(buildDir, buildDir);

  const res = await fetch(
    `${CF_API}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/deployments`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
      body: formData
    }
  );

  const data = await res.json();
  if (!data.success) throw new Error(`CF deploy failed: ${JSON.stringify(data.errors)}`);
  return data.result;
}

export async function setCustomDomain(projectName, domain) {
  const res = await fetch(
    `${CF_API}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/domains`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name: domain })
    }
  );
  const data = await res.json();
  return data.success;
}

export async function getProjectUrl(projectName) {
  return `https://${projectName}.pages.dev`;
}
