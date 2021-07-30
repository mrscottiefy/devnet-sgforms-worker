const formsg = require('@opengovsg/formsg-sdk')({
  mode: 'production',
})
const slackWebHookUrl = "https://hooks.slack.com/services/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"
const formSecretKey  = `${FORM_KEY}`
const HAS_ATTACHMENTS = false

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function readRequestBody(request) {
  const { headers } = request
  const contentType = headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    return JSON.stringify(await request.json())
  }
  else if (contentType.includes("application/text")) {
    return request.text()
  }
  else if (contentType.includes("text/html")) {
    return request.text()
  }
  else if (contentType.includes("form")) {
    const formData = await request.formData()
    const body = {}
    for (const entry of formData.entries()) {
      body[entry[0]] = entry[1]
    }
    return JSON.stringify(body)
  }
  else {
    const myBlob = await request.blob()
    const objectURL = URL.createObjectURL(myBlob)
    return objectURL
  }
}

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  if (request.method === "POST") {
    return await processRequest(request);
  }else if(request.method === "GET") {
    return new Response("Expected POST", { status: 500 })
  }
}

async function processRequest(request){
  console.log(request.headers)
  const options = {
    method: 'POST',
    headers: {
      'Content-Type':'application/json'
    },
    body: JSON.stringify(
      { 
        "text": await decryptRequest(request)
      }
    )
  }
  return await fetch(slackWebHookUrl,options);
}

async function decryptRequest(request){

  const submission = HAS_ATTACHMENTS ? await formsg.crypto.decryptWithAttachments(formSecretKey, request) : formsg.crypto.decrypt(formSecretKey, request)

  if (submission) {
    return readRequestBody(submission);
  } else {
    return "Could not decrypt the submission"
  }

}