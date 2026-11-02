export async function onRequestPost(context) {
  try {
    const { request } = context;
    const contentType = request.headers.get("content-type") || "";

    let data;
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else if (contentType.includes("form")) {
      const formData = await request.formData();
      data = Object.fromEntries(formData);
    } else {
      data = await request.text();
    }

    // Validate required fields
    if (!data.name || !data.email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Name and email are required fields." 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Serverless lead receipt timestamp & meta
    const leadRecord = {
      receivedAt: new Date().toISOString(),
      clientIp: request.headers.get("cf-connecting-ip") || "unknown",
      country: request.headers.get("cf-ipcountry") || "US",
      lead: data
    };

    // Return instant success response to front-end
    return new Response(JSON.stringify({
      success: true,
      message: "RFQ successfully received by Junction Industries commercial operations.",
      referenceId: "JCT-" + Math.floor(100000 + Math.random() * 900000),
      division: data.division || "General Industrial",
      timestamp: leadRecord.receivedAt
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message || "Internal server error" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
