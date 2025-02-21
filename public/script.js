document.getElementById("validation-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        console.log("Starting ID validation request...");

        // **Step 1: Start ID Validation (Call to /validate-id)**
        const validationResponse = await fetch("http://localhost:3000/validate-id", { method: "POST" });
        const validationData = await validationResponse.json();

        console.log("Validation Response:", validationData);

        if (!validationData.instructions || !validationData.validation_id) { // Check for validation_id
            throw new Error("Failed to get upload URLs or validation ID");
        }

        const { front_url, reverse_url } = validationData.instructions;
        const validationId = validationData.validation_id; // Get validation ID
        console.log("Upload URLs received:", { front_url, reverse_url });
        console.log("Validation ID:", validationId);

        // **Step 2: Upload Front Image (Direct PUT to Truora)**
        const frontFile = document.getElementById("front-image").files[0];
        if (!frontFile) throw new Error("Front image file is missing");
        console.log("Uploading front image directly to Truora:", frontFile.name);
        await uploadImageDirect(front_url, frontFile);
        console.log("Front image uploaded successfully!");

        // **Step 3: Upload Back Image (Direct PUT to Truora)**
        const backFile = document.getElementById("back-image").files[0];
        if (!backFile) throw new Error("Back image file is missing");
        console.log("Uploading back image directly to Truora:", backFile.name);
        await uploadImageDirect(reverse_url, backFile);
        console.log("Back image uploaded successfully!");

        alert("ID images uploaded successfully!");

        // **Step 4: Get Validation Result (Call to /validation-result/:id)**
        console.log("Fetching validation results...");
        const validationResult = await fetchValidationResult(validationId);
        console.log("Validation Result:", validationResult);

        alert("Validation result received! Check the console for details.");

    } catch (error) {
        console.error("Error:", error);
        alert("Process failed! Check the console for details.");
    }
});

async function uploadImageDirect(url, file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async () => {
            const base64Image = reader.result.split(',')[1];
            try {
                // Decode base64 using atob()
                const byteString = atob(base64Image);

                // Convert byte string to Uint8Array
                const byteArray = new Uint8Array(byteString.length);
                for (let i = 0; i < byteString.length; i++) {
                    byteArray[i] = byteString.charCodeAt(i);
                }

                const myHeaders = new Headers();
                myHeaders.append("Content-Type", "image/png");

                const requestOptions = {
                    method: "PUT",
                    headers: myHeaders,
                    body: byteArray, // Send Uint8Array
                    redirect: "follow",
                };

                fetch(url, requestOptions)
                    .then((response) => {
                        if (!response.ok) {
                            return response.text().then(errorText => {
                                console.error("Upload Error Text:", errorText);
                                reject(`Upload failed: ${response.statusText}`);
                            });
                        }
                        return response.text();
                    })
                    .then((result) => {
                        console.log("Upload Result:", result);
                        resolve();
                        console.log(`Image uploaded successfully to: ${url}`);
                    })
                    .catch((error) => {
                        console.error("Upload Error:", error);
                        reject(`Upload failed: ${error}`);
                    });

            } catch (error) {
                console.error("Upload Network Error:", error);
                reject(`Upload failed: ${error}`);
            }
        };

        reader.onerror = (error) => {
            console.error("File Reader Error:", error);
            reject(`Error reading file: ${error}`);
        };

        reader.readAsDataURL(file);
    });
}

async function fetchValidationResult(validationId) {
    const response = await fetch(`http://localhost:3000/validation-result/${validationId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch validation result: ${response.statusText}`);
    }
    return response.json();
}