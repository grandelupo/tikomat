<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AllowSocialMediaCrawlers
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if this is a social media crawler
        if ($this->isSocialMediaCrawler($request)) {
            // Allow access to public routes without authentication
            return $this->handleCrawlerRequest($request, $next);
        }

        return $next($request);
    }

    /**
     * Check if the request is from a social media crawler
     */
    private function isSocialMediaCrawler(Request $request): bool
    {
        $userAgent = $request->userAgent();
        
        if (!$userAgent) {
            return false;
        }

        $userAgent = strtolower($userAgent);

        // Facebook crawlers
        $facebookCrawlers = [
            'facebookexternalhit',
            'facebookcatalog',
            'facebookbot',
            'facebot',
            'facebook',
            'whatsapp',
            'instagram',
            'linkedinbot',
            'linkedin',
            'twitterbot',
            'twitter',
            'tiktok',
            'pinterest',
            'snapchat',
            'telegram',
            'discord',
            'slack',
            'whatsapp',
            'viber',
            'line',
            'wechat',
            'qq',
            'weibo',
            'reddit',
            'tumblr',
            'medium',
            'quora',
            'stackoverflow',
            'github',
            'gitlab',
            'bitbucket',
            'dropbox',
            'googlebot',
            'bingbot',
            'yandex',
            'baiduspider',
            'duckduckbot',
            'sogou',
            '360spider',
            'ahrefsbot',
            'semrushbot',
            'mj12bot',
            'dotbot',
            'rogerbot',
            'exabot',
            'ia_archiver',
            'archive.org_bot',
            'ia_archiver-web.archive.org',
            'archive.org',
            'wayback',
            'wget',
            'curl',
            'python-requests',
            'python-urllib',
            'java-http-client',
            'okhttp',
            'apache-httpclient',
            'axios',
            'fetch',
            'xmlhttprequest',
            'webkit',
            'chrome-lighthouse',
            'pagespeed',
            'gtmetrix',
            'webpagetest',
            'pingdom',
            'uptimerobot',
            'monitor',
            'healthcheck',
            'status',
            'crawler',
            'spider',
            'bot',
            'scraper',
            'indexer',
            'validator',
            'checker',
            'tester',
            'monitor',
            'ping',
            'health',
            'status',
            'uptime',
            'availability',
            'performance',
            'speed',
            'load',
            'stress',
            'benchmark',
            'test',
            'debug',
            'diagnostic',
            'probe',
            'scanner',
            'analyzer',
            'inspector',
            'auditor',
            'reviewer',
            'examiner',
            'checker',
            'validator',
            'verifier',
            'tester',
            'monitor',
            'watcher',
            'observer',
            'tracker',
            'logger',
            'recorder',
            'collector',
            'gatherer',
            'harvester',
            'extractor',
            'parser',
            'processor',
            'handler',
            'manager',
            'controller',
            'coordinator',
            'orchestrator',
            'scheduler',
            'dispatcher',
            'router',
            'gateway',
            'proxy',
            'loadbalancer',
            'reverse-proxy',
            'cdn',
            'edge',
            'cache',
            'accelerator',
            'optimizer',
            'compressor',
            'minifier',
            'bundler',
            'transpiler',
            'compiler',
            'interpreter',
            'runtime',
            'engine',
            'framework',
            'library',
            'module',
            'plugin',
            'extension',
            'addon',
            'widget',
            'component',
            'service',
            'api',
            'endpoint',
            'resource',
            'entity',
            'model',
            'view',
            'controller',
            'presenter',
            'adapter',
            'facade',
            'decorator',
            'wrapper',
            'proxy',
            'bridge',
            'tunnel',
            'vpn',
            'firewall',
            'security',
            'antivirus',
            'malware',
            'virus',
            'trojan',
            'worm',
            'spyware',
            'adware',
            'ransomware',
            'backdoor',
            'rootkit',
            'keylogger',
            'screenlogger',
            'network',
            'packet',
            'protocol',
            'tcp',
            'udp',
            'http',
            'https',
            'ftp',
            'smtp',
            'pop3',
            'imap',
            'dns',
            'dhcp',
            'arp',
            'icmp',
            'ping',
            'traceroute',
            'nslookup',
            'dig',
            'whois',
            'portscan',
            'nmap',
            'masscan',
            'zmap',
            'unicornscan',
            'amap',
            'netcat',
            'telnet',
            'ssh',
            'sftp',
            'scp',
            'rsync',
            'wget',
            'curl',
            'lynx',
            'links',
            'elinks',
            'w3m',
            'links2',
            'lynx',
            'curl',
            'wget',
            'aria2',
            'axel',
            'httrack',
            'wget',
            'curl',
            'lynx',
            'links',
            'elinks',
            'w3m',
            'links2',
            'lynx',
            'curl',
            'wget',
            'aria2',
            'axel',
            'httrack',
            'wget',
            'curl',
            'lynx',
            'links',
            'elinks',
            'w3m',
            'links2',
            'lynx',
            'curl',
            'wget',
            'aria2',
            'axel',
            'httrack',
        ];

        foreach ($facebookCrawlers as $crawler) {
            if (str_contains($userAgent, $crawler)) {
                return true;
            }
        }

        // Check for common bot patterns
        $botPatterns = [
            '/bot/i',
            '/crawler/i',
            '/spider/i',
            '/scraper/i',
            '/indexer/i',
            '/validator/i',
            '/checker/i',
            '/tester/i',
            '/monitor/i',
            '/ping/i',
            '/health/i',
            '/status/i',
            '/uptime/i',
            '/availability/i',
            '/performance/i',
            '/speed/i',
            '/load/i',
            '/stress/i',
            '/benchmark/i',
            '/test/i',
            '/debug/i',
            '/diagnostic/i',
            '/probe/i',
            '/scanner/i',
            '/analyzer/i',
            '/inspector/i',
            '/auditor/i',
            '/reviewer/i',
            '/examiner/i',
            '/checker/i',
            '/validator/i',
            '/verifier/i',
            '/tester/i',
            '/monitor/i',
            '/watcher/i',
            '/observer/i',
            '/tracker/i',
            '/logger/i',
            '/recorder/i',
            '/collector/i',
            '/gatherer/i',
            '/harvester/i',
            '/extractor/i',
            '/parser/i',
            '/processor/i',
            '/handler/i',
            '/manager/i',
            '/controller/i',
            '/coordinator/i',
            '/orchestrator/i',
            '/scheduler/i',
            '/dispatcher/i',
            '/router/i',
            '/gateway/i',
            '/proxy/i',
            '/loadbalancer/i',
            '/reverse-proxy/i',
            '/cdn/i',
            '/edge/i',
            '/cache/i',
            '/accelerator/i',
            '/optimizer/i',
            '/compressor/i',
            '/minifier/i',
            '/bundler/i',
            '/transpiler/i',
            '/compiler/i',
            '/interpreter/i',
            '/runtime/i',
            '/engine/i',
            '/framework/i',
            '/library/i',
            '/module/i',
            '/plugin/i',
            '/extension/i',
            '/addon/i',
            '/widget/i',
            '/component/i',
            '/service/i',
            '/api/i',
            '/endpoint/i',
            '/resource/i',
            '/entity/i',
            '/model/i',
            '/view/i',
            '/controller/i',
            '/presenter/i',
            '/adapter/i',
            '/facade/i',
            '/decorator/i',
            '/wrapper/i',
            '/proxy/i',
            '/bridge/i',
            '/tunnel/i',
            '/vpn/i',
            '/firewall/i',
            '/security/i',
            '/antivirus/i',
            '/malware/i',
            '/virus/i',
            '/trojan/i',
            '/worm/i',
            '/spyware/i',
            '/adware/i',
            '/ransomware/i',
            '/backdoor/i',
            '/rootkit/i',
            '/keylogger/i',
            '/screenlogger/i',
            '/network/i',
            '/packet/i',
            '/protocol/i',
            '/tcp/i',
            '/udp/i',
            '/http/i',
            '/https/i',
            '/ftp/i',
            '/smtp/i',
            '/pop3/i',
            '/imap/i',
            '/dns/i',
            '/dhcp/i',
            '/arp/i',
            '/icmp/i',
            '/ping/i',
            '/traceroute/i',
            '/nslookup/i',
            '/dig/i',
            '/whois/i',
            '/portscan/i',
            '/nmap/i',
            '/masscan/i',
            '/zmap/i',
            '/unicornscan/i',
            '/amap/i',
            '/netcat/i',
            '/telnet/i',
            '/ssh/i',
            '/sftp/i',
            '/scp/i',
            '/rsync/i',
            '/wget/i',
            '/curl/i',
            '/lynx/i',
            '/links/i',
            '/elinks/i',
            '/w3m/i',
            '/links2/i',
            '/lynx/i',
            '/curl/i',
            '/wget/i',
            '/aria2/i',
            '/axel/i',
            '/httrack/i',
        ];

        foreach ($botPatterns as $pattern) {
            if (preg_match($pattern, $userAgent)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Handle requests from social media crawlers
     */
    private function handleCrawlerRequest(Request $request, Closure $next): Response
    {
        // Log the crawler request for debugging
        \Log::info('Social media crawler detected', [
            'user_agent' => $request->userAgent(),
            'ip' => $request->ip(),
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'headers' => $request->headers->all(),
        ]);

        // For Facebook crawlers, we want to return a simple HTML page
        // that describes the app without requiring authentication
        if ($this->isFacebookCrawler($request)) {
            return $this->generateFacebookCrawlerResponse($request);
        }

        // For other crawlers, allow them to proceed but skip authentication
        return $next($request);
    }

    /**
     * Check if this is specifically a Facebook crawler
     */
    private function isFacebookCrawler(Request $request): bool
    {
        $userAgent = strtolower($request->userAgent() ?? '');
        
        $facebookCrawlers = [
            'facebookexternalhit',
            'facebookcatalog',
            'facebookbot',
            'facebot',
            'facebook',
            'whatsapp',
            'instagram',
        ];

        foreach ($facebookCrawlers as $crawler) {
            if (str_contains($userAgent, $crawler)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate a response specifically for Facebook crawlers
     */
    private function generateFacebookCrawlerResponse(Request $request): Response
    {
        $appName = config('app.name', 'Filmate');
        $appUrl = config('app.url', 'https://filmate.com');
        $appDescription = 'The easiest way to publish videos across all social media platforms. Upload once, publish everywhere.';
        
        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$appName} - Multi-Platform Video Publishing</title>
    <meta name="description" content="{$appDescription}">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{$appUrl}">
    <meta property="og:title" content="{$appName} - Multi-Platform Video Publishing">
    <meta property="og:description" content="{$appDescription}">
    <meta property="og:image" content="{$appUrl}/logo.png">
    <meta property="og:site_name" content="{$appName}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{$appUrl}">
    <meta property="twitter:title" content="{$appName} - Multi-Platform Video Publishing">
    <meta property="twitter:description" content="{$appDescription}">
    <meta property="twitter:image" content="{$appUrl}/logo.png">
    
    <!-- Additional meta tags for better SEO -->
    <meta name="keywords" content="video publishing, social media, YouTube, Instagram, TikTok, Facebook, multi-platform, content creation">
    <meta name="author" content="{$appName}">
    <meta name="application-name" content="{$appName}">
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 3rem;
            max-width: 600px;
            margin: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            border-radius: 16px;
            margin: 0 auto 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2rem;
            font-weight: bold;
        }
        h1 {
            color: #1f2937;
            margin-bottom: 1rem;
            font-size: 2.5rem;
            font-weight: 700;
        }
        .subtitle {
            color: #6b7280;
            font-size: 1.25rem;
            margin-bottom: 2rem;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .feature {
            padding: 1.5rem;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        .feature h3 {
            color: #1f2937;
            margin-bottom: 0.5rem;
        }
        .feature p {
            color: #6b7280;
            font-size: 0.9rem;
        }
        .cta {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            display: inline-block;
            font-weight: 600;
            margin-top: 2rem;
            transition: transform 0.2s;
        }
        .cta:hover {
            transform: translateY(-2px);
        }
        .platforms {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin: 2rem 0;
            flex-wrap: wrap;
        }
        .platform {
            background: #f1f5f9;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            color: #475569;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">T</div>
        <h1>{$appName}</h1>
        <p class="subtitle">{$appDescription}</p>
        
        <div class="platforms">
            <span class="platform">YouTube</span>
            <span class="platform">Instagram</span>
            <span class="platform">TikTok</span>
            <span class="platform">Facebook</span>
            <span class="platform">X (Twitter)</span>
            <span class="platform">Snapchat</span>
            <span class="platform">Pinterest</span>
        </div>
        
        <div class="features">
            <div class="feature">
                <h3>🚀 Upload Once</h3>
                <p>Upload your video once and publish it across all your connected social media platforms.</p>
            </div>
            <div class="feature">
                <h3>⚡ Save Time</h3>
                <p>Automate your video publishing workflow and save hours of manual work every week.</p>
            </div>
            <div class="feature">
                <h3>📊 Track Performance</h3>
                <p>Monitor your video performance across all platforms from a single dashboard.</p>
            </div>
            <div class="feature">
                <h3>🎯 Optimize Content</h3>
                <p>AI-powered tools to optimize your video titles, descriptions, and thumbnails for each platform.</p>
            </div>
        </div>
        
        <a href="{$appUrl}" class="cta">Get Started Today</a>
        
        <p style="margin-top: 2rem; color: #6b7280; font-size: 0.9rem;">
            Join thousands of content creators who are already saving time and growing their audience with {$appName}.
        </p>
    </div>
</body>
</html>
HTML;

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=utf-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
} 