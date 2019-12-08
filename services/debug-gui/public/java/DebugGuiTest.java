package com.userSrvc.client.util;

import java.util.ArrayList;
import java.util.List;

import org.junit.Test;

import lombok.Synchronized;

public class DebugGuiTest {
	private final int PARENT_ID = Integer.MAX_VALUE;

	public class DebugThreads implements Runnable {
		private Boolean debug;
		private int limit = 4;
		private String id;
		private boolean shouldInit = true;
		private String project;

		public DebugThreads(int id, int projectId, boolean debug) {
			this.debug = debug;
			this.id = getThreadId(id);
			project = getThreadId(projectId);
		}

		public DebugThreads(int id, int projectId, boolean debug, boolean shouldInit) {
			this(id, projectId, debug);
			this.shouldInit = shouldInit;
		}

		@Override
		public void run() {
			if (shouldInit) {
				DebugGui.init(debug, id);
			}
			int current = 0;
			while (limit > current) {
//				System.out.println(debug + "==" + DebugGui.debugging());
//				System.out.println(id + "==" + DebugGui.getId());
				assert(debug.equals(DebugGui.debugging()));
				assert(this.id.equals(DebugGui.getId()));
				try {
					Thread.sleep((long)Math.floor(Math.random() * 1000));
					log(project);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
				current++;
			}
		}

	}

	public static String getThreadId(int id) {
		return "DebugThreads-" + id;
	}

	List<Thread> threads = new ArrayList<Thread>();
	List<DebugThreads> debugThreads = new ArrayList<DebugThreads>();

	public String getHost() {
		return "http://localhost:3000/debug-gui";
	}

	@Test
	public void threadCheck() {
		DebugGui.setHost(getHost());
		for (int i = 0; i < 10; i++) {
			boolean debug = Math.random() < .5;
			DebugThreads debugThread = new DebugThreads(i, i, debug);
			threads.add(new Thread(debugThread));
			debugThreads.add(debugThread);
			threads.get(i).start();
		}
		for (int i = 0; i < 10; i++) {
			try {
				threads.get(i).join();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
		inheritanceThreadCheck(true, 10);
		inheritanceThreadCheck(false, 20);

		String host = DebugGui.getHost();
		for (int i = 0; i < 10; i++) {
			String threadId = getThreadId(i);
			if (debugThreads.get(i).debug) {
				printUrl(host, threadId);
			}
		}
		System.out.print("Multi Threaded ");
		printUrl(host, "DebugThreads-" + PARENT_ID);
	}

	private void printUrl(String host, String id) {
		String clientUrl = host + "/html/debug-gui-client-test.html?DebugGui.logWindow=60&DebugGui.debug=" + id;
		System.out.println(id + " Url: \n\t" + clientUrl);
	}

	public void inheritanceThreadCheck(boolean debug, int startIndex) {
		DebugGui.init(debug, getThreadId(PARENT_ID));

		for (int i = startIndex; i < startIndex + 10; i++) {
			threads.add(new Thread(new DebugThreads(PARENT_ID, i, DebugGui.debugging(), false)));
			threads.get(i).start();
		}
		for (int i = startIndex; i < startIndex + 10; i++) {
			try {
				threads.get(i).join();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
	}

	public synchronized void log(String id) throws InterruptedException {
		DebugGui.setRoot(id);
		DebugGui.link("beta", "mylabel", "http://www.google.com")
			.link("delta.foxtrot", "my2ndlabel", "http://www.google.com")
			.value("beta.charlie", "mylabel", "http://www.google.com")
			.log("beta.charlie", "mylog1: http://www.google.com")
			.log("beta.charlie", "mylog2: http://www.google.com")
			.log("beta.charlie", "mylog3: http://www.google.com")
			.log("beta.charlie", "mylog4: http://www.google.com")
			.exception("beta.charlie.echo", "myException", new Error("my message"));
	}
}
