using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly ILogger<UploadController> _logger;
    private readonly IConfiguration _configuration;

    public UploadController(ILogger<UploadController> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<object>> Upload([FromForm(Name = "file")] IFormFile? file)
    {
        // If model binding didn't bind the file, try to read from the form files collection
        if ((file == null || file.Length == 0) && Request?.Form?.Files != null && Request.Form.Files.Count > 0)
        {
            file = Request.Form.Files[0];
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file provided" });
        }

        var uploadUrl = _configuration.GetValue<string>("UploadSettings:ExternalUploadUrl");
            
        var uploadToken = _configuration.GetValue<string>("UploadSettings:ExternalUploadToken");

        try
        {
            using var httpClient = new HttpClient();
            using var content = new MultipartFormDataContent();
            
            var fileContent = new StreamContent(file.OpenReadStream());
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);
            content.Add(fileContent, "file", file.FileName);

            // Set Authorization header properly. appsettings may include the whole "Bearer <token>" string
            if (!string.IsNullOrEmpty(uploadToken))
            {
                // If the token already starts with "Bearer ", set the header value directly.
                if (uploadToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    httpClient.DefaultRequestHeaders.Add("Authorization", uploadToken);
                }
                else
                {
                    // Otherwise assume it's the raw token and use Bearer scheme
                    httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", uploadToken);
                }
            }
            
            var response = await httpClient.PostAsync(uploadUrl, content);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Upload failed with status: {Status}", response.StatusCode);
                return StatusCode((int)response.StatusCode, new { message = "Upload failed" });
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var jsonResponse = System.Text.Json.JsonDocument.Parse(responseContent);
            
            // Try to extract the URL or path from the response
            string? imageUrl = null;
            if (jsonResponse.RootElement.TryGetProperty("url", out var urlProp))
            {
                imageUrl = urlProp.GetString();
            }
            else if (jsonResponse.RootElement.TryGetProperty("path", out var pathProp))
            {
                var pathVal = pathProp.GetString();
                if (!string.IsNullOrEmpty(pathVal))
                {
                    // If path starts with '/', combine with the upload service origin
                    try
                    {
                        var baseUri = new Uri(uploadUrl);
                        var origin = baseUri.GetLeftPart(UriPartial.Authority);
                        if (pathVal.StartsWith('/'))
                        {
                            imageUrl = new Uri(new Uri(origin), pathVal).ToString();
                        }
                        else if (pathVal.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                        {
                            imageUrl = pathVal; // already absolute
                        }
                        else
                        {
                            // relative path without leading slash
                            imageUrl = new Uri(new Uri(origin + "/"), pathVal).ToString();
                        }
                    }
                    catch
                    {
                        imageUrl = pathVal; // fallback to raw path
                    }
                }
            }
            else if (jsonResponse.RootElement.TryGetProperty("file", out var fileProp))
            {
                imageUrl = fileProp.GetString();
            }

            if (string.IsNullOrEmpty(imageUrl))
            {
                // As a last resort, try to return a stringified path if present
                if (jsonResponse.RootElement.TryGetProperty("path", out var rawPath))
                {
                    var raw = rawPath.GetString();
                    if (!string.IsNullOrEmpty(raw))
                    {
                        // Try to build absolute URL from raw path
                        try
                        {
                            var baseUri = new Uri(uploadUrl);
                            var origin = baseUri.GetLeftPart(UriPartial.Authority);
                            if (raw.StartsWith('/'))
                            {
                                return Ok(new { url = new Uri(new Uri(origin), raw).ToString() });
                            }
                            else if (raw.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                            {
                                return Ok(new { url = raw });
                            }
                            else
                            {
                                return Ok(new { url = new Uri(new Uri(origin + "/"), raw).ToString() });
                            }
                        }
                        catch
                        {
                            return Ok(new { url = raw });
                        }
                    }
                }

                // Return the raw response string if we couldn't parse a URL
                return Ok(new { url = responseContent });
            }

            return Ok(new { url = imageUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
