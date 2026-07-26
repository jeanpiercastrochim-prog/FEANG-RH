async function run() {
    try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AQ.Ab8RN6IpWXZQMq2N9G9B9PshxhTvgmQHASYEwoZs-_2wOXL7Og');
        const json = await res.json();
        const flashModels = json.models.filter(m => m.name.includes('flash')).map(m => m.name);
        console.log(flashModels);
    } catch(e) {
        console.error(e);
    }
}
run();
