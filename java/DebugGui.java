package com.aetna.esw.common.util;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.exception.ExceptionUtils;
import org.codehaus.jackson.map.ObjectMapper;
import org.springframework.http.HttpHeaders;

public class DebugGui {

	private static Boolean defaultShouldDebug = false;

	private static InheritableThreadLocal<Boolean> debug = new InheritableThreadLocal<Boolean>();
	private static InheritableThreadLocal<String> id = new InheritableThreadLocal<String>();

	private static DebugGui instance;

	private static String DEBUG_ID = "DebugGui.id";

	private static String httpHost = "http://${DebugGui.ip}:3000/";
	private static String httpsHost = "https://${DebugGui.ip}:3001/";
	private static String root = "${DebugGui.projectName}";
	private static String defaultId = "Default";


	public static void init() {
		debug.set(debugging() || defaultShouldDebug);
		id.set("Default");
	}

	public static void init(boolean d, String i) {
		debug.set(d);
		id.set(i);
	}

	public static void init(boolean d) {
		debug.set(debugging() || d);
		id.set(defaultId);
	}

	private static String getCookie(String name, HttpServletRequest req) {
		String ptaCookie = "";
		Cookie[] co = req.getCookies();
		if (co != null) {
			for (int i = 0; i < co.length; i++) {
				if (name.equals(co[i].getName())) {
					ptaCookie = co[i].getValue();
				}
			}
		}
		return ptaCookie;
	}

	private static String getCookieValue(String cookieStr, String name) {
		return cookieStr.replaceAll("(^|^.*\\|)" + name + "=([^|]*?)(\\|.*$|$)", "$2");
	}

    public static void init(HttpServletRequest req) {
    	Boolean d = false;
    	String identifier = null;
    	String header = req.getHeader(DEBUG_ID);
    	String cookie = getCookie("DebugGui", req);
    	String param =  req.getParameter(DEBUG_ID);
    	if (header != null) {
    		d = true;
    		identifier = header;
    	} else if (cookie != null){
    		d = true;
    		identifier = getCookieValue(cookie, "id");
    		String httpHost = getCookieValue(cookie, "httpHost");
    		if (!httpHost.equals(cookie)) {
    			DebugGui.httpHost = httpHost;
    		}
    		String httpsHost = getCookieValue(cookie, "httpsHost");
    		if (!httpsHost.equals(cookie)) {
    			DebugGui.httpsHost = httpsHost;
    		}
		} else if (param != null){
			d = true;
			identifier = param;
		}
    	debug.set(debugging() || d);
		id.set(identifier);
    }

	public static void setHttpHost(String host) {
		if (host.lastIndexOf("/") == host.length() - 1) {
			DebugGui.httpHost = host;
		} else {
			DebugGui.httpHost = "/" + host;
		}
	}

	public static void setHttpsHost(String host) {
		if (host.lastIndexOf("/") == host.length() - 1) {
			DebugGui.httpsHost = host;
		} else {
			DebugGui.httpsHost = "/" + host;
		}
	}

	public static void setRoot(String root) {
		DebugGui.root = root;
	}

	private static String toJson(Object obj) {
	      ObjectMapper mapper = new ObjectMapper();
	      try
	      {
	         return mapper.writeValueAsString(obj);
	      } catch (java.lang.Exception e) {
	         e.printStackTrace();
	      }
	      return "{}";
	}

	private static String getUrl(String ext, String id, String group) {
		return getUrl(ext, id) + "/" + group;
	}

	private static String getUrl(String ext, String id) {
		return httpHost + httpHost + ext + "/" + id;
	}

	private static class Link {
		public String label;
		public String url;
		public Link(String label, String url) {
			this.label = label;
			this.url = url;
		}
		public String toString() {
			return toJson(this);
		}
	}

	private static class Value {
		public String key;
		public String value;

		public Value(String key, String value) {
			this.key = key;
			this.value = value;
		}

		public String toString() {
			return toJson(this);
		}
	}

	private static class Exception {
		public String id;
		public String msg;
		public String stacktrace;

		public Exception(String id, String msg, String stacktrace) {
			this.id = id;
			this.msg = msg;
			this.stacktrace = stacktrace;
		}

		public String toString() {
			return toJson(this);
		}
	}

	private static class Log {
		public String log;

		public Log(String log) {
			this.log = log;
		}

		public String toString() {
			return toJson(this);
		}
	}

	private static void restPostCall(String uri, Object obj) {
		try {
			URL url = new URL(uri);
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			con.setRequestMethod("POST");
			con.setDoOutput(true);
			con.setRequestProperty("Content-Type", "application/json");
			con.setConnectTimeout(20000);

			byte[] outputInBytes = obj.toString().getBytes("UTF-8");
			con.setRequestProperty("Content-Length",
					"" + Integer.toString(outputInBytes.length));
			OutputStream os = con.getOutputStream();
			os.write(outputInBytes);
			os.close();

			con.getResponseCode();
			con.disconnect();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private static DebugGui logObject(Object obj, String group) {
		if (!debugging()) return instance;
		String groupStr = " (" + id + "/" + getGroup(group) + ")";
		String logStr = "DebugGuiLog - " + obj.toString() + groupStr;
		log(group, logStr);
		return instance;
	}
	public static DebugGui link(String group, String label, String url) {
		if (!debugging()) return instance;
		restPostCall(getUrl("link", getId(), getGroup(group)), new Link(label, url));
		return instance;
	}

	public static DebugGui value(String group, String key, Object value) {
		if (!debugging()) return instance;
		restPostCall(getUrl("value", getId(), getGroup(group)), new Value(key, toJson(value)));
		return instance;
	}

	public static DebugGui exception(String group, String errorId, Throwable error) {
		if (!debugging()) return instance;
		restPostCall(getUrl("exception", getId(), getGroup(group)), new Exception(errorId, error.getMessage(), ExceptionUtils.getStackTrace(error)));
		return instance;
	}

	public static DebugGui log(String group, String log) {
		if (!debugging()) return instance;
		restPostCall(getUrl("log", getId()), new Log(log));
		return instance;
	}

	private static String getId() {
		return id.get();
	}

	private static String getGroup(String minor) {
		return root + "." + minor;
	}

	public static String toHtml() {
		if (!debugging()) {
			return "";
		}
		return "<script type='text/javascript' src='" + httpsHost
				+ "gui'></script>" + "<debug-gui-data url='"
				+ httpsHost + "' " + "dg-id='" + id + "' "
				+ "style='display: none;'>" + "</debug-gui-data>";
	}
	public static Boolean debugging() {
		return Boolean.TRUE.equals(debug.get());
	}

    public static void addCookie(HttpServletResponse response) {
    	if (response != null) {
		    Cookie cookie = new Cookie(DEBUG_ID, "true");
		    cookie.setMaxAge(60 * 60);
		    response.addCookie(cookie);
    	}

    }

	public static void addHeader(HttpHeaders httpHeaders) {
	    if (debugging()) {
	    	httpHeaders.add(DEBUG_ID, "true");
	    }
	}
}
