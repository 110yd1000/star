class APIVersionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/'):
            request.version = 'v1'  # Extract from URL if multiple versions exist
        return self.get_response(request)