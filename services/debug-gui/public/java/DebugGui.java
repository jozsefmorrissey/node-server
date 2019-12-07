package com.userSrvc.client.util;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.exception.ExceptionUtils;
import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;

public class DebugGui {

	private static Boolean defaultShouldDebug = true;

	private static ThreadLocal<Boolean> debug = new ThreadLocal<Boolean>();
	private static ThreadLocal<String> id = new ThreadLocal<String>();

	private static DebugGui instance;

	public static void main(String...args) {
	}

	private static String DEBUG_ID = "DebugGui.debug";

	private static String host = "http://www.jozsefmorrissey.com/";
	private static String root = "DebugGui";
	private static String id = "Default";


	public static void init() {
		debug.set(Boolean.TRUE.equals(debug.get()) || defaultShouldDebug);
	}

	public static void init(boolean d) {
		debug.set(Boolean.TRUE.equals(debug.get()) || d);
	}

  public static void init(HttpServletRequest req) {
  	Boolean d = false;
		String identifier = null;
		String header = req.getHeader(DEBUG_ID);
		String cookie = getCookie(DEBUG_ID, req);
		String param = req.getParameter(DEBUG_ID);
  	if (header != null) {
  		d = true;
			id = param;
  	} else if (cookie != null) {
  		d = true;
			id = param;
  	} else if (param != null) {
			d = true;
			id = param;
		}
  	debug.set(Boolean.TRUE.equals(debug.get()) || d);
		id.set(identifier);
	}

	private static String getCookie(String name, HttpServletRequest req) {
		Cookie[] co = req.getCookies();
		if (co != null) {
			for (int i = 0; i < co.length; i++) {
				if (name.equals(co[i].getName)) {
					return co[i].getValue();
				}
			}
		}
		return null;
	}

	private static String toJson(Object obj) {
		ObjectMapper mapper = new ObjectMapper();
		try {
			return mapper.writeValueAsString(obj);
		} catch (e) {
			e.printStackTrace();
		}
		return "{}";
	}

	public static void setHost(String host) {
		DebugGui.host = host;
	}

	public static void setRoot(String root) {
		DebugGui.root = root;
	}

	private static String getUrl(String ext, String id, String group) {
		return getUrl(ext, id) + "/" + group;
	}

	private static String getUrl(String ext, String id) {
		return host + (host.endsWith("/") ? "" : "/") + ext + "/" + id;
	}

	private static class Link {
		public String label;
		public String url;
		public Link(String label, String url) {
			this.label = label;
			this.url = url;
		}
		public String toString() {
			return Util.toJson(this);
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
			return Util.toJson(this);
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
			return Util.toJson(this);
		}
	}

	private static class Log {
		public String log;
		public Log(String log) {
			this.log = log;
		}
		public String toString() {
			return Util.toJson(this);
		}
	}

	private static void restPostCall(String uri, Object obj) {
		try {
			URL url = new URL(uri);
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			con.setRequestMethod("POST");
			con.setDoOutput(true);
			con.setRequestProperty("Content-Type","application/json");

			byte[] outputInBytes = obj.toString().getBytes("UTF-8");
			con.setRequestProperty("Content-Length", "" + Integer.toString(outputInBytes.length));
			OutputStream os = con.getOutputStream();
			os.write( outputInBytes );
			os.close();

			con.getResponseCode();
			con.disconnect();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public static DebugGui link(String group, String label, String url) {
		if (!debug.get()) return instance;
		restPostCall(getUrl("link", getId(), getGroup(group)), new Link(label, url));
		return instance;
	}
	public static DebugGui value(String group, String key, Object value) {
		if (!debug.get()) return instance;
		restPostCall(getUrl("value", getId(), getGroup(group)), new Value(key, Util.toJson(value)));
		return instance;
	}
	public static DebugGui exception(String group, String errorId, Throwable error) {
		if (!debug.get()) return instance;
		restPostCall(getUrl("exception", getId(), getGroup(group)), new Exception(errorId, error.getMessage(), ExceptionUtils.getStackTrace(error)));
		return instance;
	}
	public static DebugGui log(String group, String log) {
		if (!debug.get()) return instance;
		restPostCall(getUrl("log", getId()), new Log(log));
		return instance;
	}

	private static String getId() {
		return id.get();
	}

	private static String getGroup(String minor) {
		return root + "." + minor;
	}

	public static Boolean debugging() {
		return debug.get();
	}

  public static void addCookie(HttpServletResponse response) {
  	if (response != null) {
	    Cookie cookie = new Cookie(DEBUG_ID, "true");
	    cookie.setMaxAge(60 * 60);
	    response.addCookie(cookie);
  	}
  }

	public static void addHeader(HttpHeaders httpHeaders) {
	    if (debug.get()) {
	    	httpHeaders.add(DEBUG_ID, "true");
	    }
	}

	public static String toHtml() {
		if (!Boolean.TRUE.equals(debug.get())) {
			return "";
		}
		return "<script type='text/javascript' src='" + host +
						"js/debug-gui.js'></script><debug-gui-data url='" +
						host + "' dg-id='" + id + "' style='display:none;'></debug-gui-data>";
	}
}
