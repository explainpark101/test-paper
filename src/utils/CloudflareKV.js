class CloudflareKV {
    constructor({tokenName, baseUrl}) {
        this.baseUrl = baseUrl;
        this.tokenName = tokenName;
    }

    // sessionStorage에서 토큰을 가져오는 private 메서드
    #getHeaders() {
        const token = sessionStorage.getItem(this.tokenName);
        if (!token) throw new Error("API Token not found in sessionStorage");
        
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async readData(key) {
        const res = await fetch(`${this.baseUrl}/${key}`, {
            method: 'GET',
            headers: this.#getHeaders()
        });

        if (res.status === 401) throw new Error("Invalid or Missing Token");
        if (!res.ok) throw new Error(`Read failed: ${res.statusText}`);
        
        const text = await res.text();
        try { return JSON.parse(text); } catch { return text; }
    }

    async updateData(key, newData) {
        const res = await fetch(`${this.baseUrl}/${key}`, {
            method: 'PUT',
            headers: this.#getHeaders(),
            body: typeof newData === 'object' ? JSON.stringify(newData) : newData
        });

        if (res.status === 401) throw new Error("Invalid or Missing Token");
        return await res.text();
    }

    async deleteData(key) {
        const res = await fetch(`${this.baseUrl}/${key}`, {
            method: 'DELETE',
            headers: this.#getHeaders()
        });

        if (res.status === 401) throw new Error("Invalid or Missing Token");
        return await res.text();
    }
}

export default CloudflareKV;