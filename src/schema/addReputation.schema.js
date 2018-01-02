module.exports = {
    required: ["body"],
    properties: {
        body: {
            required: ["source_user"],
            properties: {
                source_user: {type: 'string', minLength: 1}
            }
        }
    }
};
